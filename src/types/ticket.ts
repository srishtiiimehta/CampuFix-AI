export type TicketCategory =
  | 'Plumbing'
  | 'Electricity'
  | 'Cleanliness'
  | 'Internet Connectivity';

export type DepartmentName =
  | 'Plumbing / Water Maintenance'
  | 'Electrical Maintenance'
  | 'Housekeeping / Sanitation'
  | 'IT / Network Support';

export const CATEGORY_DEPARTMENT_MAP: Record<TicketCategory, DepartmentName> = {
  'Plumbing': 'Plumbing / Water Maintenance',
  'Electricity': 'Electrical Maintenance',
  'Cleanliness': 'Housekeeping / Sanitation',
  'Internet Connectivity': 'IT / Network Support',
};

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';

export interface StatusHistoryItem {
  id: string;
  timestamp: string;
  status: TicketStatus;
  updatedBy: string;
  role: 'system' | 'staff' | 'student';
  notes: string;
}

export interface Ticket {
  ticketId: string;
  reporterId: string;
  reporterName: string;
  reporterRole?: 'student' | 'staff';
  category: TicketCategory;
  assignedDepartment: DepartmentName;
  issueSummary: string;
  reportedLocation: string;
  reportedTime: string;
  priority: TicketPriority;
  imageObservations?: string;
  studentProvidedFacts: string[];
  visualObservations: string[];
  aiInferences: string[];
  missingInformation?: string;
  clarificationQuestion?: string;
  requiresHumanReview?: boolean;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryItem[];
  relatedTicketId?: string;
  trackedBy: string[]; // student userIds tracking this ticket
  resolutionNotes?: string;
  isSafetyHazard?: boolean;
  safetyWarning?: string;
  imageUrl?: string;
  isDemo?: boolean;
  notesThread?: {
    id: string;
    author: string;
    role: 'staff' | 'student';
    timestamp: string;
    message: string;
  }[];
}

export interface ClarificationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isQuestion?: boolean;
}

export interface AnalysisResult {
  category: TicketCategory;
  assignedDepartment: DepartmentName;
  issueSummary: string;
  reportedLocation: string;
  reportedTime: string;
  priority: TicketPriority;
  imageObservations: string;
  missingInformation: string;
  clarificationQuestion?: string;
  requiresHumanReview: boolean;
  isMissingEssentialInfo: boolean;
  missingFields: string[];
  studentProvidedFacts: string[];
  visualObservations: string[];
  aiInferences: string[];
  isSafetyHazard: boolean;
  safetyWarning?: string;
  analysisSource: 'gemini' | 'fallback';
  fallbackReason?: string;
  reportIntegrity: {
    verdict: 'genuine' | 'unclear' | 'clearly_fabricated';
    confidence: number;
    evidenceReason: string;
  };
}

export interface DuplicateMatch {
  ticket: Ticket;
  similarityScore: number;
  matchReason: string;
  recommendation: 'track_existing' | 'separate_issue';
}
