import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { dataStore, ALLOWED_CATEGORIES, ALLOWED_STATUSES } from './server/dataStore';
import { analyzeStudentComplaint, detectDuplicateTickets } from './server/geminiService';
import { CampusUser, TicketCategory, TicketPriority, TicketStatus } from './src/types/ticket';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express Request augmentation for authenticated user
declare global {
  namespace Express {
    interface Request {
      user: CampusUser;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Payload limits for base64 defect photography
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // --- Backend Authentication Middleware ---
  // Resolves verified identity strictly from the database/dataStore.
  // NEVER trusts a role or permission string supplied directly by the client browser!
  app.use((req: Request, res: Response, next: NextFunction) => {
    const rawUserId = (req.headers['x-user-id'] as string) || (req.headers['authorization']?.replace(/^Bearer\s+/i, '') as string);
    const userId = rawUserId ? rawUserId.trim() : 'stu_alex_c';

    const verifiedUser = dataStore.getUserById(userId);
    if (verifiedUser) {
      req.user = verifiedUser;
    } else {
      // Default to guest student with student permissions
      req.user = {
        id: userId || 'student_guest',
        name: 'Guest Student',
        email: 'guest.student@campus.edu',
        role: 'student',
      };
    }
    next();
  });

  // --- API Endpoints ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CampusFix AI',
      timestamp: new Date().toISOString(),
      hasGeminiApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
    });
  });

  // Current authenticated user info
  app.get('/api/users/me', (req, res) => {
    res.json({ success: true, user: req.user });
  });

  // All campus users (for role switching & reference)
  app.get('/api/users', (req, res) => {
    res.json({ success: true, users: dataStore.getAllUsers() });
  });

  // Campus departments
  app.get('/api/departments', (req, res) => {
    res.json({ success: true, departments: dataStore.getAllDepartments() });
  });

  // Duplicate report associations (for auditability)
  app.get('/api/associations', (req, res) => {
    try {
      const ticketId = req.query.ticketId as string | undefined;
      let associations = ticketId
        ? dataStore.getAssociationsForTicket(ticketId)
        : dataStore.getAllAssociations();

      // If student, filter associations to only tickets they are authorized to follow
      if (req.user.role === 'student') {
        const authorizedTickets = dataStore.getTickets({}, req.user);
        const authorizedIds = new Set(authorizedTickets.map((t) => t.ticketId));
        associations = associations.filter(
          (a) => authorizedIds.has(a.ticketId) || a.reporterId === req.user.id
        );
      }

      res.json({ success: true, count: associations.length, associations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET tickets with strict server-side authorization:
  // Students can view ONLY tickets and linked reports they are authorized to follow.
  // Authorized staff can view and filter all campus work orders.
  app.get('/api/tickets', (req, res) => {
    try {
      const { search, category, priority, status, reporterId, trackedBy } = req.query;

      const tickets = dataStore.getTickets(
        {
          search: search as string,
          category: category as string,
          priority: priority as string,
          status: status as string,
          reporterId: reporterId as string,
          trackedBy: trackedBy as string,
        },
        req.user
      );

      res.json({ success: true, count: tickets.length, tickets });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve tickets: ' + err.message });
    }
  });

  // GET single ticket by ID with strict authorization
  app.get('/api/tickets/:id', (req, res) => {
    try {
      const { ticket, authorized } = dataStore.getById(req.params.id, req.user);

      if (!ticket && !authorized) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: You are not authorized to view this campus ticket or its linked reports.',
        });
      }

      if (!ticket) {
        return res.status(404).json({ success: false, error: `Ticket not found: ${req.params.id}` });
      }

      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST create new ticket:
  // - Generates unique ticket ID on server
  // - Validates category against exact allowed list: Plumbing, Electricity, Cleanliness, Internet Connectivity
  // - Validates required fields and initial status before saving
  // - Preserves createdAt and updatedAt timestamps
  // - Protects against rapid duplicate retries
  app.post('/api/tickets', (req, res) => {
    try {
      const {
        category,
        issueSummary,
        reportedLocation,
        priority,
        imageObservations,
        studentProvidedFacts,
        visualObservations,
        aiInferences,
        isSafetyHazard,
        safetyWarning,
        imageUrl,
        relatedTicketId,
      } = req.body;

      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error: Category is required. Must be one of: ' + ALLOWED_CATEGORIES.join(', '),
        });
      }

      if (!ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          error: `Validation Error: Invalid category "${category}". Strictly allowed categories are: ${ALLOWED_CATEGORIES.join(', ')}`,
        });
      }

      if (!issueSummary || typeof issueSummary !== 'string' || issueSummary.trim().length < 5) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error: issueSummary is required (minimum 5 characters).',
        });
      }

      if (!reportedLocation || typeof reportedLocation !== 'string' || reportedLocation.trim().length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error: reportedLocation is required (minimum 3 characters describing building/room).',
        });
      }

      const ticket = dataStore.create(
        {
          category,
          issueSummary,
          reportedLocation,
          priority: priority as TicketPriority,
          imageObservations,
          studentProvidedFacts,
          visualObservations,
          aiInferences,
          isSafetyHazard,
          safetyWarning,
          imageUrl,
          relatedTicketId,
        },
        req.user
      );

      res.status(201).json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // PATCH update ticket status:
  // - Only authorized staff can change assignments, statuses, and resolution notes
  // - Never trust role value supplied directly by browser!
  // - Requires resolution notes before allowing a ticket to be marked Resolved
  app.patch('/api/tickets/:id/status', (req, res) => {
    try {
      const { status, notes, resolutionNotes } = req.body;

      // AUTHORIZATION: Verify user role from database
      if (req.user.role !== 'staff') {
        return res.status(403).json({
          success: false,
          error: 'Security Violation: Only verified campus facilities staff are authorized to update ticket statuses.',
        });
      }

      if (!status || !ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Validation Error: Invalid status "${status}". Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
        });
      }

      if (status === 'Resolved' && (!resolutionNotes || resolutionNotes.trim().length < 5)) {
        return res.status(400).json({
          success: false,
          error: 'Mandatory Requirement: Staff must enter concrete resolution notes (minimum 5 characters) before marking a ticket as Resolved.',
        });
      }

      const ticket = dataStore.updateStatus(
        req.params.id,
        status as TicketStatus,
        req.user,
        notes || `Status transitioned to ${status}`,
        resolutionNotes
      );

      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST associate tracking to existing ticket (Student selects "Track existing issue"):
  // - Preserves existing ticket
  // - Records association between new report and existing ticket
  // - Allows student to follow existing issue
  // - Preserves number of associated reports
  app.post('/api/tickets/:id/track', (req, res) => {
    try {
      const {
        studentNote,
        candidateSummary,
        candidateLocation,
        candidateCategory,
        candidateFacts,
      } = req.body;

      const ticket = dataStore.trackExistingTicket(req.params.id, req.user, {
        studentNote,
        candidateSummary,
        candidateLocation,
        candidateCategory,
        candidateFacts,
      });

      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST add comment note to ticket discussion
  app.post('/api/tickets/:id/note', (req, res) => {
    try {
      const { message } = req.body;
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Note message is required' });
      }

      const ticket = dataStore.addThreadNote(req.params.id, req.user, message);
      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST analyze complaint with Gemini
  app.post('/api/gemini/analyze', async (req, res) => {
    try {
      const { complaint, image, conversationHistory } = req.body;

      if (!complaint && !image) {
        return res.status(400).json({
          success: false,
          error: 'Please provide defect description text or attach a photograph.',
        });
      }

      const result = await analyzeStudentComplaint(complaint || '', image, conversationHistory || []);
      res.json({ success: true, result });
    } catch (err: any) {
      console.error('Error in /api/gemini/analyze:', err);
      res.status(500).json({ success: false, error: 'Failed to analyze maintenance complaint: ' + err.message });
    }
  });

  // POST check duplicates before finalizing ticket:
  // - Searches existing tickets that might describe the same underlying issue
  // - Uses category match, location similarity, issue-summary similarity, active status
  // - Does not consider every ticket in same category a duplicate
  // - Returns list of possible matches with: ticketId, category, issueSummary, reportedLocation, status, reasonForMatch
  app.post('/api/gemini/check-duplicates', async (req, res) => {
    try {
      const { candidateTicket } = req.body;
      if (!candidateTicket) {
        return res.status(400).json({ success: false, error: 'candidateTicket is required' });
      }

      if (!candidateTicket.category || !ALLOWED_CATEGORIES.includes(candidateTicket.category)) {
        return res.status(400).json({
          success: false,
          error: `Valid category is required for duplicate checking. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`,
        });
      }

      // Query active tickets pool on server
      const existingTickets = dataStore.getActiveTicketsForDuplicateCheck();
      const duplicates = await detectDuplicateTickets(candidateTicket, existingTickets);

      res.json({
        success: true,
        count: duplicates.length,
        duplicates: duplicates.map((d) => ({
          ticketId: d.ticketId,
          category: d.category,
          issueSummary: d.issueSummary,
          reportedLocation: d.reportedLocation,
          status: d.status,
          reasonForMatch: d.reasonForMatch || d.matchReason,
          matchReason: d.matchReason || d.reasonForMatch,
          similarityScore: d.similarityScore,
          recommendation: d.recommendation,
          ticket: d.ticket,
        })),
      });
    } catch (err: any) {
      console.error('Error in /api/gemini/check-duplicates:', err);
      res.status(500).json({ success: false, error: 'Duplicate detection failed: ' + err.message });
    }
  });

  // POST reset demo data
  app.post('/api/demo/reset', (req, res) => {
    try {
      const tickets = dataStore.resetDemoData();
      res.json({
        success: true,
        message: 'Demonstration dataset reset to initial state with 4 sample tickets',
        tickets,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- Vite Dev Server Middleware or Static Build Serving ---
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusFix AI server running on http://0.0.0.0:${PORT} (${isDev ? 'development' : 'production'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
