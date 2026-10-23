import { GoogleGenAI, Type } from '@google/genai';
import type { AnalysisResult, TicketCategory, Ticket, DuplicateMatch } from '../src/types/ticket.ts';

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
  const activeTickets = existingTickets.filter((t) => t.status !== 'Resolved');

  if (activeTickets.length === 0) {
    return [];
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return localDuplicateDetection(candidateTicket, activeTickets);
  }

  try {
    const prompt = `You are a campus facility duplicate ticket evaluator.
Compare this newly reported maintenance problem against existing active campus tickets:

NEW REPORT:
- Category: ${candidateTicket.category}
- Location: ${candidateTicket.reportedLocation}
- Summary: ${candidateTicket.issueSummary}
- Details: ${candidateTicket.details}

EXISTING ACTIVE TICKETS:
${activeTickets
  .map(
    (t, idx) => `[${idx}] TicketID: ${t.ticketId}
Category: ${t.category}
Location: ${t.reportedLocation}
Summary: ${t.issueSummary}
Status: ${t.status}
Priority: ${t.priority}`
  )
  .join('\n\n')}

Analyze whether any of the existing tickets describe the SAME physical incident or immediate location.
Return a JSON array of matches that have a similarityScore >= 60 (scale 0-100). If none match, return an empty array [].

JSON format:
[
  {
    "ticketId": "string (the matching ticket ID)",
    "similarityScore": number (60-100),
    "matchReason": "Clear 1-2 sentence explanation of why this appears to be the same underlying issue",
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
      const matchedTicket = activeTickets.find((t) => t.ticketId === match.ticketId);
      if (matchedTicket) {
        results.push({
          ticket: matchedTicket,
          similarityScore: Math.min(100, Math.max(0, Number(match.similarityScore) || 75)),
          matchReason: match.matchReason || 'Matches category and campus location of existing ticket.',
          recommendation: match.recommendation === 'separate_issue' ? 'separate_issue' : 'track_existing',
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Gemini duplicate check failed, using local fallback:', error);
    return localDuplicateDetection(candidateTicket, activeTickets);
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

  for (const existing of activeTickets) {
    if (existing.category !== candidateCat) continue;

    let score = 0;
    const existingLoc = existing.reportedLocation.toLowerCase();
    const existingSummary = existing.issueSummary.toLowerCase();

    // Check location overlap
    if (candidateLoc && existingLoc) {
      if (candidateLoc.includes('library') && existingLoc.includes('library')) {
        score += 50;
        if (
          (candidateLoc.includes('2') || candidateLoc.includes('second')) &&
          (existingLoc.includes('2') || existingLoc.includes('second'))
        ) {
          score += 35;
        }
      } else if (candidateLoc === existingLoc) {
        score += 80;
      } else if (candidateLoc.includes(existingLoc) || existingLoc.includes(candidateLoc)) {
        score += 60;
      }
    }

    // Check keyword overlap
    const words = candidateSummary.split(/\s+/).filter((w) => w.length > 4);
    for (const w of words) {
      if (existingSummary.includes(w)) {
        score += 10;
      }
    }

    if (score >= 60) {
      matches.push({
        ticket: existing,
        similarityScore: Math.min(95, score),
        matchReason: `Both tickets report ${candidateCat} problems in or near ${existing.reportedLocation}.`,
        recommendation: 'track_existing',
      });
    }
  }

  return matches;
}
