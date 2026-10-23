import { Ticket, AnalysisResult, DuplicateMatch, TicketCategory, TicketPriority, TicketStatus } from '../types/ticket';

export async function fetchTickets(params: {
  search?: string;
  category?: string;
  priority?: string;
  status?: string;
  reporterId?: string;
  trackedBy?: string;
} = {}): Promise<Ticket[]> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'All') query.set('category', params.category);
  if (params.priority && params.priority !== 'All') query.set('priority', params.priority);
  if (params.status && params.status !== 'All') query.set('status', params.status);
  if (params.reporterId) query.set('reporterId', params.reporterId);
  if (params.trackedBy) query.set('trackedBy', params.trackedBy);

  const res = await fetch(`/api/tickets?${query.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch tickets');
  }
  const json = await res.json();
  return json.tickets || [];
}

export async function fetchTicketById(id: string): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch ticket');
  }
  const json = await res.json();
  return json.ticket;
}

export async function createTicket(ticketData: {
  reporterId: string;
  reporterName: string;
  category: TicketCategory;
  issueSummary: string;
  reportedLocation: string;
  priority: TicketPriority;
  imageObservations?: string;
  studentProvidedFacts: string[];
  visualObservations: string[];
  aiInferences: string[];
  isSafetyHazard?: boolean;
  safetyWarning?: string;
  imageUrl?: string;
  relatedTicketId?: string;
}): Promise<Ticket> {
  const res = await fetch('/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticketData),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create ticket');
  }
  const json = await res.json();
  return json.ticket;
}

export async function updateTicketStatus(
  ticketId: string,
  payload: {
    status: TicketStatus;
    updatedBy: string;
    role: 'staff';
    notes: string;
    resolutionNotes?: string;
  }
): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update ticket status');
  }
  const json = await res.json();
  return json.ticket;
}

export async function trackExistingTicket(
  ticketId: string,
  studentId: string,
  studentNote?: string
): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, studentNote }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to track ticket');
  }
  const json = await res.json();
  return json.ticket;
}

export async function addTicketNote(
  ticketId: string,
  author: string,
  role: 'staff' | 'student',
  message: string
): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, role, message }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to post note');
  }
  const json = await res.json();
  return json.ticket;
}

export const CAMPUS_LOCATIONS = [
  'Main Library',
  'Science Complex A',
  'Science Complex B',
  'Engineering Hall',
  'Student Center',
  'West Hostel',
  'North Dormitory',
  'Campus Cafeteria',
  'Recreation & Sports Center',
  'Administrative Quad',
];

export async function analyzeWithGemini(
  complaint: string,
  image?: { base64: string; mimeType: string } | null,
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[],
  validLocations: string[] = CAMPUS_LOCATIONS
): Promise<AnalysisResult> {
  const res = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ complaint, image, conversationHistory, validLocations }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gemini analysis failed');
  }
  const json = await res.json();
  return json.result;
}

export async function checkDuplicatesWithGemini(candidateTicket: {
  category: TicketCategory;
  reportedLocation: string;
  issueSummary: string;
  details: string;
}): Promise<DuplicateMatch[]> {
  const res = await fetch('/api/gemini/check-duplicates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateTicket }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Duplicate detection failed');
  }
  const json = await res.json();
  return json.duplicates || [];
}

export async function resetDemoData(): Promise<Ticket[]> {
  const res = await fetch('/api/demo/reset', { method: 'POST' });
  if (!res.ok) {
    throw new Error('Failed to reset demo data');
  }
  const json = await res.json();
  return json.tickets || [];
}
