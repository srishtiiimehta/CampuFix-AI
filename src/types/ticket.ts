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

export interface DuplicateReportAssociation {
  id: string;
  ticketId: string;
  reporterId: string;
  reporterName: string;
  decision: 'tracked_existing' | 'separate_issue';
  candidateSummary: string;
  candidateLocation: string;
  candidateCategory: TicketCategory;
  candidateFacts?: string[];
  studentNote?: string;
  createdAt: string;
  separateTicketId?: string;
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
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryItem[];
  relatedTicketId?: string;
  trackedBy: string[]; // student userIds tracking this ticket
  associatedReportCount?: number; // total count of unified reports for this defect
  associatedReports?: {
    associationId: string;
    studentId: string;
    studentName: string;
    note?: string;
    timestamp: string;
  }[];
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
  priority: TicketPriority;
  imageObservations: string;
  studentProvidedFacts: string[];
  visualObservations: string[];
  aiInferences: string[];
  isSafetyHazard: boolean;
  safetyWarning?: string;
  isMissingEssentialInfo: boolean;
  missingFields: string[];
  clarificationQuestion?: string;
}

export interface DuplicateMatch {
  ticketId: string;
  category: TicketCategory;
  issueSummary: string;
  reportedLocation: string;
  status: TicketStatus;
  reasonForMatch: string;
  matchReason?: string; // backwards compatibility alias
  similarityScore: number;
  recommendation: 'track_existing' | 'separate_issue';
  ticket: Ticket;
}

export interface CampusUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'staff';
  affiliation?: string;
  department?: string;
  title?: string;
}

export interface CampusDepartment {
  id: string;
  name: DepartmentName;
  category: TicketCategory;
  leadName: string;
  contactEmail: string;
  emergencyPhone: string;
  activeTechnicians: number;
  targetSlaHours: number;
}
