import fs from 'fs';
import path from 'path';
import { Ticket, TicketStatus, TicketCategory, CATEGORY_DEPARTMENT_MAP, StatusHistoryItem } from '../src/types/ticket';
import { INITIAL_DEMO_TICKETS } from './demoData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tickets.json');

class TicketDataStore {
  private tickets: Ticket[] = [];

  constructor() {
    this.initStore();
  }

  private initStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.tickets = parsed;
          return;
        }
      }
      // Initialize with demo tickets
      this.tickets = [...INITIAL_DEMO_TICKETS];
      this.saveToFile();
    } catch (err) {
      console.error('Error initializing TicketDataStore:', err);
      this.tickets = [...INITIAL_DEMO_TICKETS];
    }
  }

  private saveToFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.tickets, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing tickets to file:', err);
    }
  }

  public getAll(): Ticket[] {
    return [...this.tickets];
  }

  public getById(id: string): Ticket | undefined {
    return this.tickets.find((t) => t.ticketId === id);
  }

  public create(newTicketData: Partial<Ticket> & { issueSummary: string; category: TicketCategory; reportedLocation: string }): Ticket {
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
      imageUrl: newTicketData.imageUrl,
      isDemo: false,
      notesThread: []
    };

    this.tickets.unshift(ticket);
    this.saveToFile();
    return ticket;
  }

  public updateStatus(
    ticketId: string,
    newStatus: TicketStatus,
    updatedBy: string,
    role: 'staff' | 'student' | 'system',
    notes: string,
    resolutionNotes?: string
  ): Ticket {
    const ticket = this.getById(ticketId);
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
    this.saveToFile();
    return ticket;
  }

  public addThreadNote(ticketId: string, author: string, role: 'staff' | 'student', message: string): Ticket {
    const ticket = this.getById(ticketId);
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
    this.saveToFile();
    return ticket;
  }

  public trackExistingTicket(ticketId: string, studentId: string, studentNote?: string): Ticket {
    const ticket = this.getById(ticketId);
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

    this.saveToFile();
    return ticket;
  }

  public resetDemoData(): Ticket[] {
    this.tickets = [...INITIAL_DEMO_TICKETS];
    this.saveToFile();
    return this.tickets;
  }
}

export const dataStore = new TicketDataStore();
