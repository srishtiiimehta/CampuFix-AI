import fs from 'fs';
import path from 'path';
import { CATEGORY_DEPARTMENT_MAP } from '../src/types/ticket.ts';
import type { Ticket, TicketStatus, TicketCategory, StatusHistoryItem, DepartmentName } from '../src/types/ticket.ts';
import { INITIAL_DEMO_TICKETS } from './demoData.ts';

const VALID_DEPARTMENTS: DepartmentName[] = [
  'Plumbing / Water Maintenance',
  'Electrical Maintenance',
  'Housekeeping / Sanitation',
  'IT / Network Support',
];

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tickets.json');

class TicketDataStore {
  private tickets: Ticket[] = [];
  private ready?: Promise<void>;

  constructor() {}

  private ensureReady() {
    return this.ready ??= this.initStore();
  }

  private async initStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
      const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey) {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/campusfix_ticket_records?select=ticket_id,record,updated_at&order=updated_at.desc`, { headers: { apikey: serviceKey } });
          if (!response.ok) throw new Error(`Supabase tickets read failed (${response.status})`);
          const rows = await response.json() as Array<{ record: Ticket }>;
          if (rows.length) { this.tickets = rows.map((row) => row.record); this.writeLocalFile(); return; }
        } catch (error) { console.error('Supabase tickets unavailable; using local JSON fallback:', error); }
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.tickets = parsed;
          await this.saveToFile();
          return;
        }
      }
      // Initialize with demo tickets
      this.tickets = [...INITIAL_DEMO_TICKETS];
      await this.saveToFile();
    } catch (err) {
      console.error('Error initializing TicketDataStore:', err);
      this.tickets = [...INITIAL_DEMO_TICKETS];
    }
  }

  private writeLocalFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.tickets, null, 2), 'utf-8');
    } catch (err) { console.error('Error writing tickets to file:', err); }
  }

  /** Refresh the in-memory snapshot so students see staff updates made by other app instances. */
  private async refreshFromSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return;

    const response = await fetch(`${supabaseUrl}/rest/v1/campusfix_ticket_records?select=ticket_id,record,updated_at&order=updated_at.desc`, {
      headers: { apikey: serviceKey },
    });
    if (!response.ok) throw new Error(`Supabase tickets refresh failed (${response.status})`);
    const rows = await response.json() as Array<{ record: Ticket }>;
    this.tickets = rows.map((row) => row.record);
    this.writeLocalFile();
  }

  private async saveToFile(replaceAll = false) {
    this.writeLocalFile();
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return;
    if (replaceAll) {
      const cleared = await fetch(`${supabaseUrl}/rest/v1/campusfix_ticket_records?ticket_id=not.is.null`, { method: 'DELETE', headers: { apikey: serviceKey } });
      if (!cleared.ok) throw new Error(`Supabase tickets reset failed (${cleared.status})`);
    }
    const rows = this.tickets.map((ticket) => ({ ticket_id: ticket.ticketId, record: ticket, updated_at: new Date().toISOString() }));
    if (!rows.length) return;
    const response = await fetch(`${supabaseUrl}/rest/v1/campusfix_ticket_records?on_conflict=ticket_id`, {
      method: 'POST',
      headers: { apikey: serviceKey, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows),
    });
    if (!response.ok) throw new Error(`Supabase tickets write failed (${response.status}): ${await response.text()}`);
  }

  public async getAll(): Promise<Ticket[]> {
    await this.ensureReady();
    try { await this.refreshFromSupabase(); }
    catch (error) { console.error('Could not refresh tickets from Supabase; serving current snapshot:', error); }
    return [...this.tickets];
  }

  public async getById(id: string): Promise<Ticket | undefined> {
    await this.ensureReady();
    try { await this.refreshFromSupabase(); }
    catch (error) { console.error('Could not refresh tickets from Supabase; serving current snapshot:', error); }
    return this.tickets.find((t) => t.ticketId === id);
  }

  public async create(newTicketData: Partial<Ticket> & { issueSummary: string; category: TicketCategory; reportedLocation: string }): Promise<Ticket> {
    await this.ensureReady();
    const validCategories: TicketCategory[] = ['Plumbing', 'Electricity', 'Cleanliness', 'Internet Connectivity'];
    if (!validCategories.includes(newTicketData.category)) {
      throw new Error(`Invalid category: ${newTicketData.category}. Must be one of: ${validCategories.join(', ')}`);
    }

    const assignedDepartment = CATEGORY_DEPARTMENT_MAP[newTicketData.category];
    const ticketId = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const initialHistory: StatusHistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      status: 'Open',
      updatedBy: newTicketData.reporterName || 'Student',
      role: 'student',
      notes: 'Initial ticket generated and submitted via CampusFix AI.'
    };

    const ticket: Ticket = {
      ticketId,
      reporterId: newTicketData.reporterId || 'student_guest',
      reporterName: newTicketData.reporterName || 'Student Reporter',
      reporterRole: 'student',
      category: newTicketData.category,
      assignedDepartment,
      issueSummary: newTicketData.issueSummary.trim(),
      reportedLocation: newTicketData.reportedLocation.trim(),
      reportedTime: newTicketData.reportedTime || now,
      priority: newTicketData.priority || 'Medium',
      imageObservations: newTicketData.imageObservations || '',
      studentProvidedFacts: newTicketData.studentProvidedFacts || [newTicketData.issueSummary],
      visualObservations: newTicketData.visualObservations || [],
      aiInferences: newTicketData.aiInferences || [],
      missingInformation: '',
      status: 'Open',
      createdAt: now,
      updatedAt: now,
      statusHistory: [initialHistory],
      relatedTicketId: newTicketData.relatedTicketId,
      trackedBy: [newTicketData.reporterId || 'student_guest'],
      isSafetyHazard: !!newTicketData.isSafetyHazard,
      safetyWarning: newTicketData.safetyWarning,
      requiresHumanReview: !!newTicketData.requiresHumanReview,
      imageUrl: newTicketData.imageUrl,
      isDemo: false,
      notesThread: []
    };

    this.tickets.unshift(ticket);
    await this.saveToFile();
    return ticket;
  }

  public async updateStatus(
    ticketId: string,
    newStatus: TicketStatus,
    updatedBy: string,
    role: 'staff' | 'student' | 'system',
    notes: string,
    resolutionNotes?: string
  ): Promise<Ticket> {
    await this.ensureReady();
    const ticket = await this.getById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    // Role-based rule: Only staff (or system) can update status to In Progress or Resolved
    if (role === 'student') {
      throw new Error('Students are not authorized to update ticket statuses.');
    }

    // Strict requirement: Require staff to add resolution notes before marking a ticket resolved
    if (newStatus === 'Resolved') {
      if (!resolutionNotes || resolutionNotes.trim().length < 5) {
        throw new Error('Resolution notes are mandatory when marking a ticket as Resolved.');
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
      updatedBy,
      role,
      notes: notes || `Status updated to ${newStatus}`
    };

    ticket.statusHistory.push(historyItem);
    await this.saveToFile();
    return ticket;
  }

  public async updateDepartment(
    ticketId: string,
    newDepartment: DepartmentName,
    updatedBy: string,
    role: 'staff' | 'student' | 'system',
    notes?: string
  ): Promise<Ticket> {
    await this.ensureReady();
    const ticket = await this.getById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    if (role !== 'staff' && role !== 'system') {
      throw new Error('Security Violation: Only authorized campus staff may reassign ticket departments.');
    }

    if (!VALID_DEPARTMENTS.includes(newDepartment)) {
      throw new Error(`Invalid department: ${newDepartment}. Must be one of: ${VALID_DEPARTMENTS.join(', ')}`);
    }

    const previousDepartment = ticket.assignedDepartment;
    const now = new Date().toISOString();
    ticket.assignedDepartment = newDepartment;
    ticket.updatedAt = now;

    const historyItem: StatusHistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      status: ticket.status,
      updatedBy,
      role: 'staff',
      notes: notes || `Assigned department updated from "${previousDepartment}" to "${newDepartment}"`,
    };

    ticket.statusHistory.push(historyItem);
    await this.saveToFile();
    return ticket;
  }

  public async addThreadNote(ticketId: string, author: string, role: 'staff' | 'student', message: string): Promise<Ticket> {
    await this.ensureReady();
    const ticket = await this.getById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    if (!ticket.notesThread) {
      ticket.notesThread = [];
    }

    ticket.notesThread.push({
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      author,
      role,
      timestamp: new Date().toISOString(),
      message: message.trim()
    });

    ticket.updatedAt = new Date().toISOString();
    await this.saveToFile();
    return ticket;
  }

  public async trackExistingTicket(ticketId: string, studentId: string, studentNote?: string): Promise<Ticket> {
    await this.ensureReady();
    const ticket = await this.getById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    if (!ticket.trackedBy.includes(studentId)) {
      ticket.trackedBy.push(studentId);
    }

    const now = new Date().toISOString();
    ticket.updatedAt = now;

    ticket.statusHistory.push({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      status: ticket.status,
      updatedBy: `Student (${studentId})`,
      role: 'student',
      notes: studentNote || 'Another student reported experiencing this same issue and subscribed to tracking updates.'
    });

    await this.saveToFile();
    return ticket;
  }

  public async resetDemoData(): Promise<Ticket[]> {
    await this.ensureReady();
    this.tickets = [...INITIAL_DEMO_TICKETS];
    await this.saveToFile(true);
    return this.tickets;
  }
}

export const dataStore = new TicketDataStore();
