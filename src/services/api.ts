import { 
  Ticket, 
  AnalysisResult, 
  DuplicateMatch, 
  TicketCategory, 
  TicketPriority, 
  TicketStatus,
  CampusUser,
  CampusDepartment,
  DuplicateReportAssociation 
} from '../types/ticket';

// Global session user state for client-server authorization sync
let currentSessionUserId = 'stu_alex_c';

export function setActiveUserId(userId: string) {
  currentSessionUserId = userId;
}

export function getActiveUserId(): string {
  return currentSessionUserId;
}

function getRequestHeaders(additional: Record<string, string> = {}) {
  return {
    'Content-Type': 'application/json',
    'x-user-id': currentSessionUserId,
    ...additional,
  };
}

export async function fetchCurrentUser(): Promise<CampusUser> {
  const res = await fetch('/api/users/me', { headers: getRequestHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch current user session');
  }
  const json = await res.json();
  return json.user;
}

export async function fetchDepartments(): Promise<CampusDepartment[]> {
  const res = await fetch('/api/departments', { headers: getRequestHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch departments');
  }
  const json = await res.json();
  return json.departments || [];
}

export async function fetchAssociations(ticketId?: string): Promise<DuplicateReportAssociation[]> {
  const url = ticketId ? `/api/associations?ticketId=${encodeURIComponent(ticketId)}` : '/api/associations';
  const res = await fetch(url, { headers: getRequestHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch duplicate associations');
  }
  const json = await res.json();
  return json.associations || [];
}

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

  const res = await fetch(`/api/tickets?${query.toString()}`, {
    headers: getRequestHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch tickets');
  }
  const json = await res.json();
  return json.tickets || [];
}

export async function fetchTicketById(id: string): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`, {
    headers: getRequestHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch ticket ${id}`);
  }
  const json = await res.json();
  return json.ticket;
}

export async function createTicket(ticketData: {
  reporterId?: string;
  reporterName?: string;
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
    headers: getRequestHeaders(),
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
    updatedBy?: string;
    role?: 'staff';
    notes?: string;
    resolutionNotes?: string;
  }
): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/status`, {
    method: 'PATCH',
    headers: getRequestHeaders(),
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
  studentNote?: string,
  candidateDetails?: {
    candidateSummary?: string;
    candidateLocation?: string;
    candidateCategory?: TicketCategory;
    candidateFacts?: string[];
  }
): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/track`, {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({
      studentId,
      studentNote,
      ...candidateDetails,
    }),
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
    headers: getRequestHeaders(),
    body: JSON.stringify({ author, role, message }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to post note');
  }
  const json = await res.json();
  return json.ticket;
}

export async function analyzeWithGemini(
  complaint: string,
  image?: { base64: string; mimeType: string } | null,
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
): Promise<AnalysisResult> {
  const res = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({ complaint, image, conversationHistory }),
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
    headers: getRequestHeaders(),
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
  const res = await fetch('/api/demo/reset', { 
    method: 'POST',
    headers: getRequestHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to reset demo data');
  }
  const json = await res.json();
  return json.tickets || [];
}
