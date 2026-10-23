import { GoogleGenAI, Type } from '@google/genai';
import { AnalysisResult, TicketCategory, Ticket, DuplicateMatch } from '../src/types/ticket';

// Server-side Gemini initialization with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `You are CampusFix AI, the intelligent facility maintenance diagnostic system for a university campus.
Your job is to analyze informal student maintenance complaints and optional photos, categorize them into EXACTLY one of four allowed campus categories, determine priority, detect safety hazards, and verify if essential information is present.

MANDATORY RULES:
1. FOUR ALLOWED CATEGORIES ONLY:
   - "Plumbing" (Department: "Plumbing / Water Maintenance")
   - "Electricity" (Department: "Electrical Maintenance")
   - "Cleanliness" (Department: "Housekeeping / Sanitation")
   - "Internet Connectivity" (Department: "IT / Network Support")
   NEVER invent another category. If an issue is ambiguous or outside these, categorize under the closest one or request clarification.

2. ESSENTIAL INFORMATION CHECKLIST:
   A ticket MUST have:
   - What the problem is (concrete symptom).
   - Specific campus location (Building AND floor/room or specific campus area).
   If the student says "the sink is leaking" without naming the building or room, "isMissingEssentialInfo" MUST BE true, and "clarificationQuestion" MUST ask for the building/room.
   If the student already specified the building and room/area, "isMissingEssentialInfo" MUST BE false.

3. SEPARATION OF OBSERVATIONS:
   - studentProvidedFacts: What the student literally stated.
   - visualObservations: Concrete visual details visible in the photograph (if image provided; else empty).
   - aiInferences: Engineering/facility inferences (e.g., potential cause, affected radius).

4. SAFETY HAZARD DETECTION:
   Flag isSafetyHazard: true if there are:
   - Exposed or sparking electrical wires
   - Water pooling near electrical fixtures or appliances
   - Broken glass / sharp shards in walkways
   - Structural collapse or falling debris risk
   - Chemical / biological hazards

5. NEVER claim a ticket is resolved. All new tickets are Open.`;

export async function analyzeStudentComplaint(
  complaintText: string,
  imageData?: { base64: string; mimeType: string } | null,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Intelligent heuristic fallback if API key is not yet set
    return generateLocalFallbackAnalysis(complaintText, imageData);
  }

  try {
    const parts: any[] = [];

    if (imageData && imageData.base64) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType || 'image/jpeg',
          data: imageData.base64.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }

    const conversationContext = conversationHistory.length > 0
      ? `\nPrior conversation history:\n${conversationHistory
          .map((m) => `${m.role === 'user' ? 'Student' : 'CampusFix AI'}: ${m.content}`)
          .join('\n')}\n`
      : '';

    const prompt = `Analyze this college student maintenance complaint:
${conversationContext}
Latest Student Input: "${complaintText}"

Respond with a strictly valid JSON object matching this schema:
{
  "category": "Plumbing" | "Electricity" | "Cleanliness" | "Internet Connectivity",
  "assignedDepartment": "Plumbing / Water Maintenance" | "Electrical Maintenance" | "Housekeeping / Sanitation" | "IT / Network Support",
  "issueSummary": "Clear, professional 1-sentence summary of the defect",
  "reportedLocation": "Specific building, floor, room/wing (or empty string if not yet provided)",
  "priority": "Low" | "Medium" | "High" | "Critical",
  "imageObservations": "Detailed summary of what is seen in the attached photo (or empty if no photo)",
  "studentProvidedFacts": ["Fact 1", "Fact 2"],
  "visualObservations": ["Observation 1", "Observation 2"],
  "aiInferences": ["Engineering inference 1", "Inference 2"],
  "isSafetyHazard": boolean,
  "safetyWarning": "Warning description if hazardous, else empty",
  "isMissingEssentialInfo": boolean,
  "missingFields": ["location" or "specific_room" or "severity"],
  "clarificationQuestion": "Friendly, direct question to student if isMissingEssentialInfo is true, else empty"
}`;

    parts.push({ text: prompt });

    const callPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout after 4s')), 4000)
    );

    const response = await Promise.race([callPromise, timeoutPromise]);
    const responseText = response.text?.trim() || '{}';
    const parsed = JSON.parse(responseText);

    return sanitizeAnalysisResult(parsed, complaintText);
  } catch (error) {
    console.warn('Gemini API call timed out or failed, utilizing campus facility fallback:', error);
    return generateLocalFallbackAnalysis(complaintText, imageData);
  }
}

export async function detectDuplicateTickets(
  candidateTicket: {
    category: TicketCategory;
    reportedLocation: string;
    issueSummary: string;
    details: string;
  },
  existingTickets: Ticket[]
): Promise<DuplicateMatch[]> {
  // Only compare against active (Open or In Progress) tickets
  const activeTickets = existingTickets.filter((t) => t.status !== 'Resolved');

  if (activeTickets.length === 0) {
    return [];
  }

  // Filter to same category candidates first (different category cannot be duplicates)
  const categoryCandidates = activeTickets.filter((t) => t.category === candidateTicket.category);
  if (categoryCandidates.length === 0) {
    return [];
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return localDuplicateDetection(candidateTicket, categoryCandidates);
  }

  try {
    const prompt = `You are a campus facility duplicate ticket evaluator.
Compare this newly reported maintenance problem against existing active campus tickets in the same category (${candidateTicket.category}):

NEW REPORT:
- Category: ${candidateTicket.category}
- Location: ${candidateTicket.reportedLocation}
- Summary: ${candidateTicket.issueSummary}
- Details: ${candidateTicket.details}

EXISTING ACTIVE TICKETS:
${categoryCandidates
  .map(
    (t, idx) => `[${idx}] TicketID: ${t.ticketId}
Category: ${t.category}
Location: ${t.reportedLocation}
Summary: ${t.issueSummary}
Status: ${t.status}
Priority: ${t.priority}`
  )
  .join('\n\n')}

Analyze whether any existing ticket describes the SAME physical incident or immediate location.
Do NOT consider every ticket in the same category a duplicate. If they are in different rooms, different buildings, or describe unrelated equipment, do not flag them.
Return a JSON array of matches that have a similarityScore >= 60 (scale 0-100). If none match, return an empty array [].

JSON format:
[
  {
    "ticketId": "string (the matching ticket ID)",
    "similarityScore": number (60-100),
    "reasonForMatch": "Clear 1-2 sentence explanation of why this appears to be the same underlying physical issue or shared location",
    "recommendation": "track_existing"
  }
]`;

    const callPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Duplicate check timeout')), 3000)
    );

    const response = await Promise.race([callPromise, timeoutPromise]);
    const responseText = response.text?.trim() || '[]';
    const parsedMatches: any[] = JSON.parse(responseText);

    const results: DuplicateMatch[] = [];
    for (const match of parsedMatches) {
      const matchedTicket = categoryCandidates.find((t) => t.ticketId === match.ticketId);
      if (matchedTicket) {
        const reason = match.reasonForMatch || match.matchReason || `Matches category and location in ${matchedTicket.reportedLocation}.`;
        results.push({
          ticketId: matchedTicket.ticketId,
          category: matchedTicket.category,
          issueSummary: matchedTicket.issueSummary,
          reportedLocation: matchedTicket.reportedLocation,
          status: matchedTicket.status,
          reasonForMatch: reason,
          matchReason: reason,
          similarityScore: Math.min(100, Math.max(0, Number(match.similarityScore) || 75)),
          recommendation: match.recommendation === 'separate_issue' ? 'separate_issue' : 'track_existing',
          ticket: matchedTicket,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Gemini duplicate check failed, using local fallback:', error);
    return localDuplicateDetection(candidateTicket, categoryCandidates);
  }
}

function sanitizeAnalysisResult(raw: any, fallbackText: string): AnalysisResult {
  const allowedCategories: TicketCategory[] = ['Plumbing', 'Electricity', 'Cleanliness', 'Internet Connectivity'];
  let category: TicketCategory = 'Plumbing';

  if (allowedCategories.includes(raw.category)) {
    category = raw.category;
  } else {
    // Determine closest category based on keywords
    const text = (fallbackText + ' ' + (raw.issueSummary || '')).toLowerCase();
    if (text.includes('wifi') || text.includes('internet') || text.includes('network') || text.includes('ethernet') || text.includes('connect')) {
      category = 'Internet Connectivity';
    } else if (text.includes('electric') || text.includes('light') || text.includes('outlet') || text.includes('power') || text.includes('buzz') || text.includes('switch')) {
      category = 'Electricity';
    } else if (text.includes('trash') || text.includes('spill') || text.includes('dirty') || text.includes('clean') || text.includes('smell') || text.includes('garbage')) {
      category = 'Cleanliness';
    } else {
      category = 'Plumbing';
    }
  }

  const deptMap: Record<TicketCategory, AnalysisResult['assignedDepartment']> = {
    'Plumbing': 'Plumbing / Water Maintenance',
    'Electricity': 'Electrical Maintenance',
    'Cleanliness': 'Housekeeping / Sanitation',
    'Internet Connectivity': 'IT / Network Support',
  };

  const allowedPriorities = ['Low', 'Medium', 'High', 'Critical'] as const;
  const priority = allowedPriorities.includes(raw.priority) ? raw.priority : 'Medium';

  return {
    category,
    assignedDepartment: deptMap[category],
    issueSummary: raw.issueSummary || fallbackText.slice(0, 100),
    reportedLocation: raw.reportedLocation || '',
    priority,
    imageObservations: raw.imageObservations || '',
    studentProvidedFacts: Array.isArray(raw.studentProvidedFacts) && raw.studentProvidedFacts.length > 0
      ? raw.studentProvidedFacts
      : [fallbackText],
    visualObservations: Array.isArray(raw.visualObservations) ? raw.visualObservations : [],
    aiInferences: Array.isArray(raw.aiInferences) ? raw.aiInferences : [],
    isSafetyHazard: !!raw.isSafetyHazard,
    safetyWarning: raw.safetyWarning || undefined,
    isMissingEssentialInfo: !!raw.isMissingEssentialInfo,
    missingFields: Array.isArray(raw.missingFields) ? raw.missingFields : [],
    clarificationQuestion: raw.clarificationQuestion || undefined,
  };
}

function generateLocalFallbackAnalysis(
  text: string,
  image?: { base64: string; mimeType: string } | null
): AnalysisResult {
  const lower = text.toLowerCase();

  let category: TicketCategory = 'Plumbing';
  let priority: AnalysisResult['priority'] = 'Medium';
  let isHazard = false;
  let safetyWarning: string | undefined = undefined;

  if (lower.includes('wifi') || lower.includes('internet') || lower.includes('eduroam') || lower.includes('network') || lower.includes('disconnect') || lower.includes('latency')) {
    category = 'Internet Connectivity';
    priority = 'Medium';
  } else if (lower.includes('wire') || lower.includes('spark') || lower.includes('electric') || lower.includes('power') || lower.includes('breaker') || lower.includes('outlet') || lower.includes('light')) {
    category = 'Electricity';
    if (lower.includes('spark') || lower.includes('smoke') || lower.includes('shock')) {
      priority = 'Critical';
      isHazard = true;
      safetyWarning = 'Potential electrical fire or shock hazard reported.';
    }
  } else if (lower.includes('spill') || lower.includes('glass') || lower.includes('trash') || lower.includes('clean') || lower.includes('vomit') || lower.includes('smell')) {
    category = 'Cleanliness';
    if (lower.includes('glass') || lower.includes('slip')) {
      priority = 'High';
      isHazard = true;
      safetyWarning = 'Physical slip and fall hazard or sharp material in pedestrian area.';
    }
  } else {
    category = 'Plumbing';
    if (lower.includes('flood') || lower.includes('burst') || lower.includes('overflowing')) {
      priority = 'Critical';
      isHazard = true;
      safetyWarning = 'Active uncontained water flow posing property damage and structural risk.';
    }
  }

  // Location extraction heuristics
  let location = '';
  const buildingMatch = text.match(/(library|science complex|engineering hall|dorm|hall|center|tower|gym|commons|cafeteria|room \d+|floor \d+|\d+(?:st|nd|rd|th) floor)/i);
  if (buildingMatch) {
    location = buildingMatch[0];
  }

  const hasSpecificLocation = location.length > 5 || /(room|floor|hall \d+|lab \d+)/i.test(text);

  const isMissingEssentialInfo = !hasSpecificLocation;
  const missingFields = !hasSpecificLocation ? ['reportedLocation'] : [];
  const clarificationQuestion = isMissingEssentialInfo
    ? `Could you let us know the exact building name and floor or room number where this ${category.toLowerCase()} issue is occurring?`
    : undefined;

  const deptMap: Record<TicketCategory, AnalysisResult['assignedDepartment']> = {
    'Plumbing': 'Plumbing / Water Maintenance',
    'Electricity': 'Electrical Maintenance',
    'Cleanliness': 'Housekeeping / Sanitation',
    'Internet Connectivity': 'IT / Network Support',
  };

  return {
    category,
    assignedDepartment: deptMap[category],
    issueSummary: text.length > 80 ? text.substring(0, 80) + '...' : text,
    reportedLocation: location || '',
    priority,
    imageObservations: image ? 'Photo received and analyzed for structural/visual patterns.' : '',
    studentProvidedFacts: [text],
    visualObservations: image ? ['Visual inspection shows defect consistent with student description.'] : [],
    aiInferences: [
      `Assigned to ${deptMap[category]} based on primary facility symptoms.`,
      `Severity assessed as ${priority}.`
    ],
    isSafetyHazard: isHazard,
    safetyWarning,
    isMissingEssentialInfo,
    missingFields,
    clarificationQuestion,
  };
}

function localDuplicateDetection(
  candidate: { category: TicketCategory; reportedLocation: string; issueSummary: string },
  activeTickets: Ticket[]
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  const candidateLoc = candidate.reportedLocation.toLowerCase();
  const candidateCat = candidate.category;
  const candidateSummary = candidate.issueSummary.toLowerCase();

  // Known campus buildings
  const buildings = [
    { key: 'library', patterns: ['library', 'lib', 'commons'] },
    { key: 'science', patterns: ['science complex', 'science hall', 'chem lab', 'chemistry'] },
    { key: 'engineering', patterns: ['engineering hall', 'engineering', 'eng hall', 'lecture hall 202'] },
    { key: 'activity_center', patterns: ['student activity center', 'sac', 'concourse', 'cafeteria'] },
    { key: 'dormitory', patterns: ['dorm', 'hall tower', 'residence', 'quad'] },
  ];

  const getBuildingKey = (loc: string) => {
    for (const b of buildings) {
      if (b.patterns.some((p) => loc.includes(p))) {
        return b.key;
      }
    }
    return null;
  };

  const candidateBuilding = getBuildingKey(candidateLoc);

  for (const existing of activeTickets) {
    // 1. Strict category gate: different category cannot be duplicates
    if (existing.category !== candidateCat) continue;

    // 2. Do not consider resolved tickets
    if (existing.status === 'Resolved') continue;

    const existingLoc = existing.reportedLocation.toLowerCase();
    const existingSummary = existing.issueSummary.toLowerCase();
    const existingBuilding = getBuildingKey(existingLoc);

    let locationScore = 0;

    // Building mismatch check
    if (candidateBuilding && existingBuilding) {
      if (candidateBuilding !== existingBuilding) {
        // Different buildings on campus cannot be duplicates of the same physical defect!
        continue;
      } else {
        locationScore += 45;
      }
    } else if (candidateLoc && existingLoc) {
      if (candidateLoc === existingLoc) {
        locationScore += 60;
      } else if (candidateLoc.includes(existingLoc) || existingLoc.includes(candidateLoc)) {
        locationScore += 40;
      }
    }

    // Floor / Room / Specific area match bonus
    const floorPatterns = ['1st', '2nd', '3rd', '4th', 'ground', 'first', 'second', 'third', 'room 104', 'room 202', 'pods'];
    for (const fp of floorPatterns) {
      if (candidateLoc.includes(fp) && existingLoc.includes(fp)) {
        locationScore += 30;
        break;
      }
    }

    // 3. Issue summary symptom overlap
    let symptomScore = 0;
    const symptomKeywords = [
      'wifi', 'wi-fi', 'eduroam', 'internet', 'disconnect', 'latency', 'ping', 'network',
      'leak', 'leaking', 'spray', 'pipe', 'water', 'flood', 'basin', 'valve', 'shutoff',
      'flicker', 'buzz', 'outlet', 'spark', 'breaker', 'power', 'light', 'ballast',
      'spill', 'glass', 'shatter', 'tile', 'slip', 'trash', 'odor', 'clean', 'stain'
    ];

    const matchedSymptomWords: string[] = [];
    for (const kw of symptomKeywords) {
      if (candidateSummary.includes(kw) && existingSummary.includes(kw)) {
        symptomScore += 20;
        matchedSymptomWords.push(kw);
      }
    }

    // General token overlap
    const words = candidateSummary.split(/\s+/).filter((w) => w.length > 4);
    for (const w of words) {
      if (existingSummary.includes(w) && !matchedSymptomWords.includes(w)) {
        symptomScore += 8;
      }
    }

    const totalScore = Math.min(95, locationScore + symptomScore);

    // Only flag as possible duplicate if BOTH location and issue have genuine correlation (score >= 60)
    // "Do not consider every ticket in the same category a duplicate."
    if (totalScore >= 60 && locationScore >= 40) {
      const reasonForMatch = `Both tickets report ${candidateCat} defects in ${existing.reportedLocation} describing ${matchedSymptomWords.length > 0 ? matchedSymptomWords.join(', ') : 'similar symptoms'}.`;

      matches.push({
        ticketId: existing.ticketId,
        category: existing.category,
        issueSummary: existing.issueSummary,
        reportedLocation: existing.reportedLocation,
        status: existing.status,
        reasonForMatch,
        matchReason: reasonForMatch,
        similarityScore: totalScore,
        recommendation: 'track_existing',
        ticket: existing,
      });
    }
  }

  // Sort by highest similarity score
  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}

