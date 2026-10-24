import { 
  Ticket, 
  AnalysisResult, 
  DuplicateMatch, 
  TicketCategory, 
  TicketPriority, 
  TicketStatus, 
  DepartmentName 
} from '../types/ticket';

// In-memory and persistent token storage
let currentToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('campusfix_jwt') : null;

export function setAuthToken(token: string | null) {
  currentToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('campusfix_jwt', token);
    } else {
      localStorage.removeItem('campusfix_jwt');
    }
  }
}

export function getAuthToken(): string | null {
  return currentToken;
}

export function getHeaders(includeContentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }
  return headers;
}

export interface AuthUser {
  userId: string;
  name: string;
  role: 'student' | 'staff';
  category: string;
  staffApproved: boolean;
  email: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export interface CreateAccountResponse {
  success: boolean;
  confirmationRequired: boolean;
  message?: string;
  token?: string;
  user?: AuthUser;
}

export async function createAccount(fullName: string, email: string, password: string, role: 'student' | 'staff', category: string): Promise<CreateAccountResponse> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, password, role, category }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Account creation failed. Please try again.');
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Login failed. Please check your credentials.');
  }

  setAuthToken(data.token);
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (!currentToken) return null;
  try {
    const res = await fetch('/api/auth/me', {
      headers: getHeaders(false),
    });
    if (!res.ok) {
      setAuthToken(null);
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export function logout() {
  setAuthToken(null);
}

export async function fetchTickets(params: {
  search?: string;
  category?: string;
  priority?: string;
  status?: string;
} = {}): Promise<Ticket[]> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'All') query.set('category', params.category);
  if (params.priority && params.priority !== 'All') query.set('priority', params.priority);
  if (params.status && params.status !== 'All') query.set('status', params.status);

  const res = await fetch(`/api/tickets?${query.toString()}`, {
    headers: getHeaders(false),
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
    headers: getHeaders(false),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch ticket');
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
    headers: getHeaders(),
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
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update ticket status');
  }
  const json = await res.json();
  return json.ticket;
}

export async function updateTicketDepartment(
  ticketId: string,
  department: DepartmentName,
  notes?: string
): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/department`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ department, notes }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update ticket department');
  }
  const json = await res.json();
  return json.ticket;
}

export async function trackExistingTicket(
  ticketId: string,
  studentId?: string,
  studentNote?: string
): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/track`, {
    method: 'POST',
    headers: getHeaders(),
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
    headers: getHeaders(),
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
    headers: getHeaders(),
    body: JSON.stringify({ complaint, image, conversationHistory, validLocations }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.error || 'Gemini analysis failed');
    Object.assign(error, { code: data.code });
    throw error;
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
    headers: getHeaders(),
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
    headers: getHeaders(false),
  });
  if (!res.ok) {
    throw new Error('Failed to reset demo data');
  }
  const json = await res.json();
  return json.tickets || [];
}



export interface FlaggedAccount {
  id: string;
  full_name: string;
  flag_reason: string | null;
  flagged_at: string | null;
}

export async function fetchFlaggedAccounts(): Promise<FlaggedAccount[]> {
  const res = await fetch('/api/moderation/flags', { headers: getHeaders(false) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not load flagged accounts.');
  return data.flags || [];
}

export async function clearAccountFlag(userId: string): Promise<void> {
  const res = await fetch(`/api/moderation/flags/${encodeURIComponent(userId)}/clear`, { method: 'PATCH', headers: getHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not clear account flag.');
}
