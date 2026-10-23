import fs from 'fs';
import path from 'path';
import { 
  Ticket, 
  TicketStatus, 
  TicketCategory, 
  DepartmentName,
  CATEGORY_DEPARTMENT_MAP, 
  StatusHistoryItem,
  DuplicateReportAssociation,
  CampusUser,
  CampusDepartment
} from '../src/types/ticket';
import { INITIAL_DEMO_TICKETS } from './demoData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const ASSOCIATIONS_FILE = path.join(DATA_DIR, 'duplicateAssociations.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const DEPARTMENTS_FILE = path.join(DATA_DIR, 'departments.json');

// Exact allowed categories
export const ALLOWED_CATEGORIES: TicketCategory[] = [
  'Plumbing',
  'Electricity',
  'Cleanliness',
  'Internet Connectivity',
];

export const ALLOWED_STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Resolved'];

// Initial seed campus departments
export const INITIAL_DEPARTMENTS: CampusDepartment[] = [
  {
    id: 'dept_plumbing',
    name: 'Plumbing / Water Maintenance',
    category: 'Plumbing',
    leadName: 'Robert Santos (Lead Master Plumber)',
    contactEmail: 'facilities-plumbing@campus.edu',
    emergencyPhone: 'x4101',
    activeTechnicians: 6,
    targetSlaHours: 4,
  },
  {
    id: 'dept_electrical',
    name: 'Electrical Maintenance',
    category: 'Electricity',
    leadName: 'Elena Rostova (Electrical Supervisor)',
    contactEmail: 'facilities-electrical@campus.edu',
    emergencyPhone: 'x4102',
    activeTechnicians: 8,
    targetSlaHours: 2,
  },
  {
    id: 'dept_cleanliness',
    name: 'Housekeeping / Sanitation',
    category: 'Cleanliness',
    leadName: 'Maria Alvarez (Sanitation Supervisor)',
    contactEmail: 'facilities-sanitation@campus.edu',
    emergencyPhone: 'x4103',
    activeTechnicians: 14,
    targetSlaHours: 1,
  },
  {
    id: 'dept_it',
    name: 'IT / Network Support',
    category: 'Internet Connectivity',
    leadName: 'David Kim (Network Systems Admin)',
    contactEmail: 'it-network@campus.edu',
    emergencyPhone: 'x4104',
    activeTechnicians: 10,
    targetSlaHours: 6,
  },
];

// Initial seed campus users (Students & Staff)
export const INITIAL_USERS: CampusUser[] = [
  {
    id: 'stu_alex_c',
    name: 'Alex Chen (Sophomore)',
    email: 'alex.chen@campus.edu',
    role: 'student',
    affiliation: 'Undergraduate College of Letters & Science',
  },
  {
    id: 'stu_sarah_m',
    name: 'Sarah Miller (Sophomore)',
    email: 'sarah.miller@campus.edu',
    role: 'student',
    affiliation: 'Undergraduate Computer Science',
  },
  {
    id: 'stu_marcus_b',
    name: 'Marcus Bell (Junior)',
    email: 'marcus.b@campus.edu',
    role: 'student',
    affiliation: 'Bio-Organic Chemistry Major',
  },
  {
    id: 'stu_emma_t',
    name: 'Emma Torres (Senior)',
    email: 'emma.t@campus.edu',
    role: 'student',
    affiliation: 'School of Engineering',
  },
  {
    id: 'stu_jordan_l',
    name: 'Jordan Lee (Freshman)',
    email: 'jordan.l@campus.edu',
    role: 'student',
    affiliation: 'Undergraduate Student Life',
  },
  {
    id: 'staff_marcus_v',
    name: 'Marcus Vance (Facilities Lead)',
    email: 'm.vance@facilities.campus.edu',
    role: 'staff',
    department: 'Facilities Operations Lead',
    title: 'University Facility Operations Supervisor',
  },
  {
    id: 'staff_robert_s',
    name: 'Robert Santos (Lead Plumber)',
    email: 'r.santos@facilities.campus.edu',
    role: 'staff',
    department: 'Plumbing / Water Maintenance',
    title: 'Master Campus Plumber',
  },
  {
    id: 'staff_david_k',
    name: 'David Kim (IT Network Admin)',
    email: 'd.kim@it.campus.edu',
    role: 'staff',
    department: 'IT / Network Support',
    title: 'Senior Network Systems Specialist',
  },
  {
    id: 'staff_maria_a',
    name: 'Maria Alvarez (Sanitation Supervisor)',
    email: 'm.alvarez@facilities.campus.edu',
    role: 'staff',
    department: 'Housekeeping / Sanitation',
    title: 'Sanitation & Custodial Dispatcher',
  },
];

// Initial seed duplicate report associations for demo tickets
export const INITIAL_ASSOCIATIONS: DuplicateReportAssociation[] = [
  {
    id: 'assoc-demo-001',
    ticketId: 'TKT-DEMO-001',
    reporterId: 'stu_alex_k',
    reporterName: 'Alex Kovacs (Student)',
    decision: 'tracked_existing',
    candidateSummary: 'Laptop continuously dropping Eduroam connection on Library 2nd floor desk row E',
    candidateLocation: 'Main University Library, 2nd Floor',
    candidateCategory: 'Internet Connectivity',
    candidateFacts: ['Frequent drops during study hours', 'Ping timed out'],
    studentNote: 'Student Alex Kovacs subscribed to tracking updates for Library WiFi defect.',
    createdAt: '2026-10-23T04:45:00.000Z',
  },
  {
    id: 'assoc-demo-002',
    ticketId: 'TKT-DEMO-001',
    reporterId: 'stu_priya_r',
    reporterName: 'Priya Raman (Student)',
    decision: 'tracked_existing',
    candidateSummary: 'Campus-Secure WiFi unavailable near quiet study pods',
    candidateLocation: 'Main University Library, 2nd Floor East Wing',
    candidateCategory: 'Internet Connectivity',
    candidateFacts: ['Study pod 4 cannot acquire IP address'],
    studentNote: 'Student Priya Raman subscribed to tracking updates for Library WiFi defect.',
    createdAt: '2026-10-23T05:10:00.000Z',
  },
  {
    id: 'assoc-demo-003',
    ticketId: 'TKT-DEMO-002',
    reporterId: 'fac_prof_vance',
    reporterName: 'Prof. J. Vance (Faculty)',
    decision: 'tracked_existing',
    candidateSummary: 'Water puddle expanding toward electrical conduit in lab 104',
    candidateLocation: 'Science Complex B, Room 104',
    candidateCategory: 'Plumbing',
    candidateFacts: ['Lab session paused due to water hazard'],
    studentNote: 'Faculty member joined tracking updates for urgent lab sink leak.',
    createdAt: '2026-10-22T21:00:00.000Z',
  },
];

class TicketDataStore {
  private tickets: Ticket[] = [];
  private associations: DuplicateReportAssociation[] = [];
  private users: CampusUser[] = [];
  private departments: CampusDepartment[] = [];

  constructor() {
    this.initStore();
  }

  private initStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // 1. Tickets
      if (fs.existsSync(TICKETS_FILE)) {
        const raw = fs.readFileSync(TICKETS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.tickets = parsed.map((t) => ({
            ...t,
            associatedReportCount: t.associatedReportCount || (t.trackedBy ? t.trackedBy.length : 1),
            associatedReports: t.associatedReports || [],
          }));
        } else {
          this.tickets = this.buildInitialTickets();
          this.saveTickets();
        }
      } else {
        this.tickets = this.buildInitialTickets();
        this.saveTickets();
      }

      // 2. Duplicate Report Associations
      if (fs.existsSync(ASSOCIATIONS_FILE)) {
        const raw = fs.readFileSync(ASSOCIATIONS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.associations = parsed;
        } else {
          this.associations = [...INITIAL_ASSOCIATIONS];
          this.saveAssociations();
        }
      } else {
        this.associations = [...INITIAL_ASSOCIATIONS];
        this.saveAssociations();
      }

      // 3. Campus Users
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.users = parsed;
        } else {
          this.users = [...INITIAL_USERS];
          this.saveUsers();
        }
      } else {
        this.users = [...INITIAL_USERS];
        this.saveUsers();
      }

      // 4. Campus Departments
      if (fs.existsSync(DEPARTMENTS_FILE)) {
        const raw = fs.readFileSync(DEPARTMENTS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.departments = parsed;
        } else {
          this.departments = [...INITIAL_DEPARTMENTS];
          this.saveDepartments();
        }
      } else {
        this.departments = [...INITIAL_DEPARTMENTS];
        this.saveDepartments();
      }
    } catch (err) {
      console.error('Error initializing TicketDataStore:', err);
      this.tickets = this.buildInitialTickets();
      this.associations = [...INITIAL_ASSOCIATIONS];
      this.users = [...INITIAL_USERS];
      this.departments = [...INITIAL_DEPARTMENTS];
    }
  }

  private buildInitialTickets(): Ticket[] {
    return INITIAL_DEMO_TICKETS.map((t) => ({
      ...t,
      associatedReportCount: t.trackedBy ? t.trackedBy.length : 1,
      associatedReports: t.ticketId === 'TKT-DEMO-001'
        ? [
            {
              associationId: 'assoc-demo-001',
              studentId: 'stu_alex_k',
              studentName: 'Alex Kovacs (Student)',
              note: 'Reported disconnections at desk row E.',
              timestamp: '2026-10-23T04:45:00.000Z',
            },
            {
              associationId: 'assoc-demo-002',
              studentId: 'stu_priya_r',
              studentName: 'Priya Raman (Student)',
              note: 'Study pod 4 could not acquire IP.',
              timestamp: '2026-10-23T05:10:00.000Z',
            },
          ]
        : t.ticketId === 'TKT-DEMO-002'
        ? [
            {
              associationId: 'assoc-demo-003',
              studentId: 'fac_prof_vance',
              studentName: 'Prof. J. Vance (Faculty)',
              note: 'Water puddle expanding near chemical cabinet.',
              timestamp: '2026-10-22T21:00:00.000Z',
            },
          ]
        : [],
    }));
  }

  // Atomic file save helpers
  private saveTickets() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(TICKETS_FILE, JSON.stringify(this.tickets, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing tickets to file:', err);
    }
  }

  private saveAssociations() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(ASSOCIATIONS_FILE, JSON.stringify(this.associations, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing duplicate associations to file:', err);
    }
  }

  private saveUsers() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing users to file:', err);
    }
  }

  private saveDepartments() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DEPARTMENTS_FILE, JSON.stringify(this.departments, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing departments to file:', err);
    }
  }

  // User retrieval
  public getUserById(id: string): CampusUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  public getAllUsers(): CampusUser[] {
    return [...this.users];
  }

  // Department retrieval
  public getAllDepartments(): CampusDepartment[] {
    return [...this.departments];
  }

  // Duplicate associations retrieval
  public getAllAssociations(): DuplicateReportAssociation[] {
    return [...this.associations];
  }

  public getAssociationsForTicket(ticketId: string): DuplicateReportAssociation[] {
    return this.associations.filter((a) => a.ticketId === ticketId);
  }

  // Query tickets with strict authorization
  public getTickets(
    filter: {
      category?: string;
      priority?: string;
      status?: string;
      search?: string;
      reporterId?: string;
      trackedBy?: string;
    },
    user: CampusUser
  ): Ticket[] {
    let list = [...this.tickets];

    // AUTHORIZATION ENFORCEMENT:
    // Students can view ONLY tickets and linked reports they are authorized to follow.
    if (user.role === 'student') {
      list = list.filter(
        (t) => t.reporterId === user.id || (t.trackedBy && t.trackedBy.includes(user.id))
      );
    }

    if (filter.category && filter.category !== 'All') {
      list = list.filter((t) => t.category === filter.category);
    }

    if (filter.priority && filter.priority !== 'All') {
      list = list.filter((t) => t.priority === filter.priority);
    }

    if (filter.status && filter.status !== 'All') {
      list = list.filter((t) => t.status === filter.status);
    }

    if (filter.reporterId) {
      list = list.filter((t) => t.reporterId === filter.reporterId);
    }

    if (filter.trackedBy) {
      const tb = filter.trackedBy;
      list = list.filter((t) => t.trackedBy && t.trackedBy.includes(tb));
    }

    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.ticketId.toLowerCase().includes(q) ||
          t.issueSummary.toLowerCase().includes(q) ||
          t.reportedLocation.toLowerCase().includes(q) ||
          t.assignedDepartment.toLowerCase().includes(q)
      );
    }

    return list;
  }

  // Get active tickets for server-side duplicate check (sanitized search pool)
  public getActiveTicketsForDuplicateCheck(): Ticket[] {
    return this.tickets.filter((t) => t.status !== 'Resolved');
  }

  public getAllTicketsUnrestricted(): Ticket[] {
    return [...this.tickets];
  }

  // Get single ticket by ID with authorization check
  public getById(id: string, user: CampusUser): { ticket?: Ticket; authorized: boolean } {
    const ticket = this.tickets.find((t) => t.ticketId === id);
    if (!ticket) {
      return { ticket: undefined, authorized: true };
    }

    if (user.role === 'student') {
      const isAuthorized =
        ticket.reporterId === user.id || (ticket.trackedBy && ticket.trackedBy.includes(user.id));
      if (!isAuthorized) {
        return { ticket: undefined, authorized: false };
      }
    }

    return { ticket, authorized: true };
  }

  // Ticket creation with validation, server-side ID, and idempotency protection
  public create(
    newTicketData: Partial<Ticket> & {
      category: TicketCategory;
      issueSummary: string;
      reportedLocation: string;
      reporterId?: string;
      reporterName?: string;
    },
    user: CampusUser
  ): Ticket {
    // 1. Validate Category against exact allowed list
    if (!ALLOWED_CATEGORIES.includes(newTicketData.category)) {
      throw new Error(
        `Invalid category "${newTicketData.category}". Must be exactly one of: ${ALLOWED_CATEGORIES.join(', ')}`
      );
    }

    // 2. Validate Required Fields
    const trimmedSummary = (newTicketData.issueSummary || '').trim();
    if (!trimmedSummary || trimmedSummary.length < 5) {
      throw new Error('Mandatory field: issueSummary must be at least 5 characters in length.');
    }

    const trimmedLocation = (newTicketData.reportedLocation || '').trim();
    if (!trimmedLocation || trimmedLocation.length < 3) {
      throw new Error('Mandatory field: reportedLocation must specify building and room or specific area.');
    }

    const reporterId = user.id || newTicketData.reporterId || 'student_guest';
    const reporterName = user.name || newTicketData.reporterName || 'Student Reporter';

    // 3. Idempotency Check: Avoid creating duplicate tickets repeatedly when user retries a failed or lagging submission
    const nowMs = Date.now();
    const recentDuplicate = this.tickets.find((t) => {
      const createdAtMs = new Date(t.createdAt).getTime();
      return (
        t.reporterId === reporterId &&
        t.category === newTicketData.category &&
        t.reportedLocation.toLowerCase() === trimmedLocation.toLowerCase() &&
        t.issueSummary.toLowerCase() === trimmedSummary.toLowerCase() &&
        nowMs - createdAtMs < 60000 // within 60 seconds
      );
    });

    if (recentDuplicate) {
      return recentDuplicate;
    }

    // 4. Generate unique ticket ID on the server
    let ticketId = '';
    let attempts = 0;
    while (!ticketId || this.tickets.some((t) => t.ticketId === ticketId)) {
      const year = new Date().getFullYear();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      ticketId = `TKT-${year}-${randNum}`;
      attempts++;
      if (attempts > 100) {
        ticketId = `TKT-${year}-${Date.now().toString().slice(-6)}`;
        break;
      }
    }

    const now = new Date().toISOString();
    const assignedDepartment = CATEGORY_DEPARTMENT_MAP[newTicketData.category];

    const initialHistory: StatusHistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      status: 'Open',
      updatedBy: reporterName,
      role: user.role === 'staff' ? 'staff' : 'student',
      notes: newTicketData.relatedTicketId
        ? `Ticket submitted as separate issue (flagged relative to ticket ${newTicketData.relatedTicketId}).`
        : 'Initial ticket generated and submitted via CampusFix AI.',
    };

    const ticket: Ticket = {
      ticketId,
      reporterId,
      reporterName,
      reporterRole: user.role,
      category: newTicketData.category,
      assignedDepartment,
      issueSummary: trimmedSummary,
      reportedLocation: trimmedLocation,
      reportedTime: newTicketData.reportedTime || now,
      priority: newTicketData.priority || 'Medium',
      imageObservations: newTicketData.imageObservations || '',
      studentProvidedFacts:
        Array.isArray(newTicketData.studentProvidedFacts) && newTicketData.studentProvidedFacts.length > 0
          ? newTicketData.studentProvidedFacts
          : [trimmedSummary],
      visualObservations: newTicketData.visualObservations || [],
      aiInferences: newTicketData.aiInferences || [],
      missingInformation: '',
      status: 'Open',
      createdAt: now,
      updatedAt: now,
      statusHistory: [initialHistory],
      relatedTicketId: newTicketData.relatedTicketId,
      trackedBy: [reporterId],
      associatedReportCount: 1,
      associatedReports: [],
      isSafetyHazard: !!newTicketData.isSafetyHazard,
      safetyWarning: newTicketData.safetyWarning,
      imageUrl: newTicketData.imageUrl,
      isDemo: false,
      notesThread: [],
    };

    // If student chose "Submit as separate issue" after duplicate review, record decision for auditability
    if (newTicketData.relatedTicketId) {
      const association: DuplicateReportAssociation = {
        id: `assoc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ticketId: newTicketData.relatedTicketId,
        reporterId,
        reporterName,
        decision: 'separate_issue',
        candidateSummary: trimmedSummary,
        candidateLocation: trimmedLocation,
        candidateCategory: newTicketData.category,
        candidateFacts: newTicketData.studentProvidedFacts,
        createdAt: now,
        separateTicketId: ticketId,
        studentNote: `Student chose to submit as separate issue from ${newTicketData.relatedTicketId}.`,
      };
      this.associations.unshift(association);
      this.saveAssociations();
    }

    this.tickets.unshift(ticket);
    this.saveTickets();
    return ticket;
  }

  // Student selects "Track existing issue":
  // - Preserves existing ticket
  // - Records association between new report and existing ticket
  // - Allows student to follow existing issue
  // - Preserves and increments number of associated reports
  public trackExistingTicket(
    ticketId: string,
    user: CampusUser,
    details?: {
      studentNote?: string;
      candidateSummary?: string;
      candidateLocation?: string;
      candidateCategory?: TicketCategory;
      candidateFacts?: string[];
    }
  ): Ticket {
    const ticket = this.tickets.find((t) => t.ticketId === ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const now = new Date().toISOString();
    const studentId = user.id;
    const studentName = user.name;

    // 1. Record association in persistent storage
    const assocId = `assoc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const associationRecord: DuplicateReportAssociation = {
      id: assocId,
      ticketId,
      reporterId: studentId,
      reporterName: studentName,
      decision: 'tracked_existing',
      candidateSummary: details?.candidateSummary || 'Student confirmed matching existing issue',
      candidateLocation: details?.candidateLocation || ticket.reportedLocation,
      candidateCategory: details?.candidateCategory || ticket.category,
      candidateFacts: details?.candidateFacts,
      studentNote: details?.studentNote,
      createdAt: now,
    };
    this.associations.unshift(associationRecord);
    this.saveAssociations();

    // 2. Allow student to follow existing issue
    if (!ticket.trackedBy.includes(studentId)) {
      ticket.trackedBy.push(studentId);
    }

    // 3. Preserve and increment associatedReportCount
    ticket.associatedReportCount = (ticket.associatedReportCount || 1) + 1;

    // 4. Record associated report entry on ticket
    if (!ticket.associatedReports) {
      ticket.associatedReports = [];
    }
    ticket.associatedReports.push({
      associationId: assocId,
      studentId,
      studentName,
      note: details?.studentNote,
      timestamp: now,
    });

    // 5. Add to status history audit trail
    ticket.updatedAt = now;
    ticket.statusHistory.push({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      status: ticket.status,
      updatedBy: studentName,
      role: 'student',
      notes: details?.studentNote || `Student (${studentName}) joined tracking updates. Total associated reports: ${ticket.associatedReportCount}.`,
    });

    this.saveTickets();
    return ticket;
  }

  // Update status with strict staff authorization and mandatory resolution notes
  public updateStatus(
    ticketId: string,
    newStatus: TicketStatus,
    user: CampusUser,
    notes: string,
    resolutionNotes?: string
  ): Ticket {
    const ticket = this.tickets.find((t) => t.ticketId === ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    // AUTHORIZATION RULE: Only authorized staff can change assignments, statuses, and resolution notes.
    // Never trust role value supplied directly by browser!
    if (user.role !== 'staff') {
      throw new Error('Access Denied: Only authorized facility staff members may modify ticket statuses or resolution notes.');
    }

    // Validate Status
    if (!ALLOWED_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status "${newStatus}". Must be one of: ${ALLOWED_STATUSES.join(', ')}`);
    }

    // Require resolution notes before allowing a ticket to be marked Resolved
    if (newStatus === 'Resolved') {
      if (!resolutionNotes || resolutionNotes.trim().length < 5) {
        throw new Error('Mandatory Requirement: Staff must enter concrete resolution notes (minimum 5 characters) before marking a ticket as Resolved.');
      }
    }

    const now = new Date().toISOString();
    ticket.status = newStatus;
    ticket.updatedAt = now;

    if (newStatus === 'Resolved') {
      ticket.resolutionNotes = resolutionNotes?.trim();
    }

    const historyItem: StatusHistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      status: newStatus,
      updatedBy: user.name,
      role: 'staff',
      notes: notes || `Status changed to ${newStatus} by ${user.name}`,
    };

    ticket.statusHistory.push(historyItem);
    this.saveTickets();
    return ticket;
  }

  // Add thread note
  public addThreadNote(
    ticketId: string,
    user: CampusUser,
    message: string
  ): Ticket {
    const ticket = this.tickets.find((t) => t.ticketId === ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    // Validate user is authorized (staff or reporter/tracker)
    if (user.role === 'student') {
      const isAuthorized =
        ticket.reporterId === user.id || (ticket.trackedBy && ticket.trackedBy.includes(user.id));
      if (!isAuthorized) {
        throw new Error('Access Denied: You cannot post notes on a ticket you are not authorized to follow.');
      }
    }

    if (!message || message.trim().length === 0) {
      throw new Error('Note message cannot be empty.');
    }

    if (!ticket.notesThread) {
      ticket.notesThread = [];
    }

    const now = new Date().toISOString();
    ticket.notesThread.push({
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      author: user.name,
      role: user.role,
      timestamp: now,
      message: message.trim(),
    });

    ticket.updatedAt = now;
    this.saveTickets();
    return ticket;
  }

  // Reset demo dataset
  public resetDemoData(): Ticket[] {
    this.tickets = this.buildInitialTickets();
    this.associations = [...INITIAL_ASSOCIATIONS];
    this.users = [...INITIAL_USERS];
    this.departments = [...INITIAL_DEPARTMENTS];

    this.saveTickets();
    this.saveAssociations();
    this.saveUsers();
    this.saveDepartments();

    return [...this.tickets];
  }
}

export const dataStore = new TicketDataStore();
