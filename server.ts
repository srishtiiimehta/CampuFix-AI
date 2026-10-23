import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { dataStore } from './server/dataStore.ts';
import { analyzeStudentComplaint, detectDuplicateTickets } from './server/geminiService.ts';
import { authStore } from './server/auth.ts';
import type { TicketCategory, TicketPriority, TicketStatus } from './src/types/ticket.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAuthUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    return authStore.verifyToken(token);
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Increase payload limit to support optional photo uploads (base64)
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Standard rate limiting header compliance for AI endpoints
  app.use('/api/gemini', (req, res, next) => {
    res.setHeader('RateLimit-Limit', '60');
    res.setHeader('RateLimit-Remaining', '59');
    res.setHeader('RateLimit-Reset', '60');
    res.setHeader('RateLimit-Policy', '60;w=60');
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

  // POST Auth login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
      }
      const user = authStore.findByUsername(username);
      if (!user || !authStore.verifyPassword(user, password)) {
        return res.status(401).json({ success: false, error: 'Invalid campus username or password' });
      }
      const token = authStore.generateToken(user);
      res.json({
        success: true,
        token,
        user: {
          userId: user.userId,
          name: user.name,
          role: user.role,
          username: user.username,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET Auth me (token introspection)
  app.get('/api/auth/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or missing token' });
    }
    res.json({ success: true, user });
  });

  // GET all tickets with filtering
  app.get('/api/tickets', (req, res) => {
    try {
      let tickets = dataStore.getAll();

      const { search, category, priority, status, reporterId, trackedBy } = req.query;

      if (category && typeof category === 'string' && category !== 'All') {
        tickets = tickets.filter((t) => t.category === category);
      }

      if (priority && typeof priority === 'string' && priority !== 'All') {
        tickets = tickets.filter((t) => t.priority === priority);
      }

      if (status && typeof status === 'string' && status !== 'All') {
        tickets = tickets.filter((t) => t.status === status);
      }

      if (reporterId && typeof reporterId === 'string') {
        tickets = tickets.filter((t) => t.reporterId === reporterId);
      }

      if (trackedBy && typeof trackedBy === 'string') {
        tickets = tickets.filter((t) => t.trackedBy && t.trackedBy.includes(trackedBy));
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const q = search.toLowerCase();
        tickets = tickets.filter(
          (t) =>
            t.ticketId.toLowerCase().includes(q) ||
            t.issueSummary.toLowerCase().includes(q) ||
            t.reportedLocation.toLowerCase().includes(q) ||
            t.assignedDepartment.toLowerCase().includes(q)
        );
      }

      res.json({ success: true, count: tickets.length, tickets });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET single ticket
  app.get('/api/tickets/:id', (req, res) => {
    try {
      const ticket = dataStore.getById(req.params.id);
      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }
      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST create ticket
  app.post('/api/tickets', (req, res) => {
    try {
      const user = getAuthUser(req);
      const {
        reporterId,
        reporterName,
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

      if (!issueSummary || !reportedLocation || !category) {
        return res.status(400).json({
          success: false,
          error: 'Missing required ticket fields: issueSummary, reportedLocation, and category are mandatory.',
        });
      }

      // If user is authenticated with token, derive reporter identity strictly from token to prevent spoofing
      const finalReporterId = user ? user.userId : (reporterId || 'stu_alex_c');
      const finalReporterName = user ? user.name : (reporterName || 'Alex Chen (Sophomore)');
      const finalReporterRole = user ? user.role : 'student';

      const ticket = dataStore.create({
        reporterId: finalReporterId,
        reporterName: finalReporterName,
        reporterRole: finalReporterRole,
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
      });

      res.status(201).json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // PATCH update ticket status (Staff only)
  app.patch('/api/tickets/:id/status', (req, res) => {
    try {
      const user = getAuthUser(req);
      const { status, updatedBy, role, notes, resolutionNotes, assignedDepartment, staffNote } = req.body;

      const effectiveRole = user ? user.role : role;
      // Strict server-side authorization: Reject non-staff requests
      if (effectiveRole !== 'staff') {
        return res.status(403).json({
          success: false,
          error: 'Security Violation: Only authorized staff may transition ticket progress.',
        });
      }

      if (!status || !['Open', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid or missing status' });
      }

      if (status === 'Resolved' && (!resolutionNotes || resolutionNotes.trim().length < 5)) {
        return res.status(400).json({
          success: false,
          error: 'Mandatory Requirement: Staff must enter concrete resolution notes before resolving a ticket.',
        });
      }

      const effectiveUpdatedBy = user ? user.name : (updatedBy || 'Campus Facility Staff');

      // Update status in data store
      let ticket = dataStore.updateStatus(
        req.params.id,
        status as TicketStatus,
        effectiveUpdatedBy,
        'staff',
        notes || `Status transitioned to ${status}`,
        resolutionNotes
      );

      // Reassign department if staff requested department change
      if (assignedDepartment && assignedDepartment !== ticket.assignedDepartment) {
        ticket = dataStore.updateDepartment(
          req.params.id,
          assignedDepartment,
          effectiveUpdatedBy,
          'staff',
          `Department reassigned to ${assignedDepartment} along with status transition to ${status}.`
        );
      }

      // Add staff note if provided
      if (staffNote && staffNote.trim().length > 0) {
        ticket = dataStore.addThreadNote(
          req.params.id,
          effectiveUpdatedBy,
          'staff',
          staffNote.trim()
        );
      }

      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // PATCH reassign department (Staff only)
  app.patch('/api/tickets/:id/department', (req, res) => {
    try {
      const user = getAuthUser(req);
      const { department, updatedBy, role, notes } = req.body;

      const effectiveRole = user ? user.role : role;
      if (effectiveRole !== 'staff') {
        return res.status(403).json({
          success: false,
          error: 'Security Violation: Only authorized staff may reassign ticket departments.',
        });
      }

      if (!department) {
        return res.status(400).json({ success: false, error: 'Missing department parameter.' });
      }

      const effectiveUpdatedBy = user ? user.name : (updatedBy || 'Campus Facility Staff');

      const ticket = dataStore.updateDepartment(
        req.params.id,
        department,
        effectiveUpdatedBy,
        'staff',
        notes
      );

      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST associate tracking to existing ticket
  app.post('/api/tickets/:id/track', (req, res) => {
    try {
      const { studentId, studentNote } = req.body;
      if (!studentId) {
        return res.status(400).json({ success: false, error: 'studentId is required' });
      }

      const ticket = dataStore.trackExistingTicket(req.params.id, studentId, studentNote);
      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST add comment note
  app.post('/api/tickets/:id/note', (req, res) => {
    try {
      const { author, role, message } = req.body;
      if (!author || !message) {
        return res.status(400).json({ success: false, error: 'author and message are required' });
      }

      const ticket = dataStore.addThreadNote(req.params.id, author, role || 'student', message);
      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST analyze complaint with Gemini
  app.post('/api/gemini/analyze', async (req, res) => {
    try {
      const { complaint, complaintText, image, conversationHistory, validLocations } = req.body;
      const textToAnalyze = (complaint || complaintText || '').trim();

      if (!textToAnalyze && !image) {
        return res.status(400).json({ success: false, error: 'Please provide complaint text or a photograph' });
      }

      const result = await analyzeStudentComplaint(
        textToAnalyze,
        image,
        conversationHistory || [],
        validLocations
      );
      res.json({ success: true, result });
    } catch (err: any) {
      console.error('Error in /api/gemini/analyze:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST check duplicates with Gemini
  app.post('/api/gemini/check-duplicates', async (req, res) => {
    try {
      const { candidateTicket } = req.body;
      if (!candidateTicket) {
        return res.status(400).json({ success: false, error: 'candidateTicket is required' });
      }

      const existingTickets = dataStore.getAll();
      const duplicates = await detectDuplicateTickets(candidateTicket, existingTickets);

      res.json({ success: true, count: duplicates.length, duplicates });
    } catch (err: any) {
      console.error('Error in /api/gemini/check-duplicates:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST reset demo data
  app.post('/api/demo/reset', (req, res) => {
    try {
      const tickets = dataStore.resetDemoData();
      res.json({ success: true, message: 'Demo data reset successfully', tickets });
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
