import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { dataStore } from './server/dataStore.ts';
import { analyzeStudentComplaint, detectDuplicateTickets } from './server/geminiService.ts';
import type { TicketCategory, TicketPriority, TicketStatus } from './src/types/ticket.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

type CampusUser = { userId: string; name: string; role: 'student' | 'staff'; category: string; staffApproved: boolean; email: string; isFlagged: boolean; flagReason?: string };
const STAFF_CATEGORIES = ['Dean', 'Professor', 'Sweeper', 'Plumber', 'Electrician'];
const STUDENT_CATEGORIES = ['Student', 'CR'];
const CAMPUS_EMAIL_DOMAIN = 'zenithschool.ai';

function isCampusEmail(email: string) {
  return /^[^\s@]+@zenithschool\.ai$/i.test(email.trim());
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) throw new Error('Supabase is not configured. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.');
  return { url, anonKey, serviceKey };
}

async function getProfile(userId: string, serviceKey: string, url: string): Promise<CampusUser | null> {
  const response = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,full_name,role,category,staff_approved,is_flagged,flag_reason`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (!response.ok) throw new Error('Could not load the account profile from Supabase. Apply the CampusFix profile migration.');
  const rows = await response.json() as Array<{ id: string; full_name: string; role: 'student' | 'staff'; category?: string | null; staff_approved?: boolean | null; is_flagged?: boolean | null; flag_reason?: string | null }>;
  const row = rows[0];
  return row ? { userId: row.id, name: row.full_name, role: row.role, category: row.category || (row.role === 'staff' ? 'Staff' : 'Student'), staffApproved: row.role !== 'staff' || row.staff_approved === true, email: '', isFlagged: row.is_flagged === true, flagReason: row.flag_reason || undefined } : null;
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Increase payload limit to support optional photo uploads (base64)
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // --- API Endpoints ---

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { url, anonKey, serviceKey } = supabaseConfig();
      const { email, password } = req.body;
      if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
        return res.status(400).json({ success: false, error: 'Enter your email and password.' });
      }
      if (!isCampusEmail(email)) return res.status(403).json({ success: false, error: `Use your @${CAMPUS_EMAIL_DOMAIN} campus email to sign in.` });
      const authResponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST', headers: { apikey: anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const authData = await authResponse.json() as { access_token?: string; user?: { id: string; email?: string; email_confirmed_at?: string | null; phone?: string; user_metadata?: { display_name?: string } }; msg?: string; message?: string; code?: string };
      if (!authResponse.ok || !authData.access_token || !authData.user) {
        const authError = `${authData.msg || authData.message || ''} ${authData.code || ''}`.toLowerCase();
        const emailMessage = authError.includes('confirm') || authError.includes('verified') || authError.includes('email_not_confirmed')
          ? 'Please confirm your email using the link we sent before signing in.'
          : (authData.msg || authData.message || 'Email or password is incorrect.');
        return res.status(401).json({ success: false, error: emailMessage });
      }
      const profile = await getProfile(authData.user.id, serviceKey, url);
      if (!profile) return res.status(403).json({ success: false, error: 'Account profile is missing. Contact your administrator.' });
      if (profile.isFlagged) return res.status(403).json({ success: false, code: 'ACCOUNT_FLAGGED', error: 'This account is flagged for campus staff review. Contact the campus facilities team before signing in.' });
      if (!authData.user.email_confirmed_at) return res.status(403).json({ success: false, error: 'Please confirm your email using the link we sent before signing in.' });
      if (profile.role === 'staff' && !profile.staffApproved) return res.status(403).json({ success: false, error: 'Your staff account is awaiting administrator approval. You can sign in after it is approved.' });
      profile.email = authData.user.email || '';
      profile.name = profile.name || authData.user.user_metadata?.display_name || profile.email;
      res.json({ success: true, token: authData.access_token, user: profile });
    } catch (error) {
      res.status(503).json({ success: false, error: error instanceof Error ? error.message : 'Supabase sign-in is unavailable.' });
    }
  });

  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { url, anonKey, serviceKey } = supabaseConfig();
      const { fullName, email, password, role: requestedRole = 'student', category: requestedCategory } = req.body;
      if (typeof fullName !== 'string' || !fullName.trim() || typeof email !== 'string' || !email.trim() || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ success: false, error: 'Enter your name, a valid email, and a password with at least 8 characters.' });
      }
      if (!isCampusEmail(email)) return res.status(400).json({ success: false, error: `Only @${CAMPUS_EMAIL_DOMAIN} campus email addresses can create an account.` });
      if (requestedRole !== 'student' && requestedRole !== 'staff') return res.status(400).json({ success: false, error: 'Choose a valid account type.' });
      const validCategories = requestedRole === 'staff' ? STAFF_CATEGORIES : STUDENT_CATEGORIES;
      const category = typeof requestedCategory === 'string' && validCategories.includes(requestedCategory) ? requestedCategory : (requestedRole === 'student' ? 'Student' : '');
      if (!category) return res.status(400).json({ success: false, error: 'Choose a valid category for this account type.' });

      const authResponse = await fetch(`${url}/auth/v1/signup`, {
        method: 'POST',
        headers: { apikey: anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, data: { full_name: fullName.trim(), requested_role: requestedRole, category } }),
      });
      const authData = await authResponse.json() as {
        access_token?: string;
        id?: string;
        email?: string;
        user_metadata?: { full_name?: string };
        user?: { id: string; email?: string; email_confirmed_at?: string | null; user_metadata?: { full_name?: string } };
        msg?: string;
        message?: string;
        error?: string;
        error_description?: string;
      };
      const signupUser = authData.user || (authData.id ? { id: authData.id, email: authData.email, user_metadata: authData.user_metadata } : undefined);
      if (!authResponse.ok || !signupUser?.id) {
        return res.status(400).json({ success: false, error: authData.msg || authData.message || authData.error_description || authData.error || 'Could not create the account.' });
      }

      // Keep account creation working even if the optional signup trigger has not been installed.
      let profile = await getProfile(signupUser.id, serviceKey, url);
      if (!profile) {
        const profileResponse = await fetch(`${url}/rest/v1/profiles`, {
          method: 'POST',
          headers: { apikey: serviceKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ id: signupUser.id, full_name: fullName.trim(), role: 'student', category: 'Student', staff_approved: false }),
        });
        if (!profileResponse.ok) throw new Error('The account was created, but its student profile could not be saved. Check that the public.profiles table is available.');
        profile = await getProfile(signupUser.id, serviceKey, url);
      }
      if (!profile) throw new Error('The account was created, but its profile could not be loaded.');

      // Public signup can request staff status, but can never approve it. Approval is set only by an administrator.
      const profileUpdate = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(signupUser.id)}`, {
        method: 'PATCH',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ role: requestedRole, category, staff_approved: false }),
      });
      if (!profileUpdate.ok) throw new Error('The account was created, but its category could not be saved. Apply the latest Supabase migration.');
      profile = await getProfile(signupUser.id, serviceKey, url);
      if (!profile) throw new Error('The account was created, but its profile could not be loaded.');

      const confirmationRequired = !authData.access_token || requestedRole === 'staff';
      const message = requestedRole === 'staff'
        ? 'Staff request submitted. Confirm your email, then wait for an administrator to approve your staff account before signing in.'
        : 'Account created. Check your email to confirm your account, then sign in.';
      if (confirmationRequired) return res.status(201).json({ success: true, confirmationRequired: true, message });
      profile.email = signupUser.email || email.trim();
      profile.name = profile.name || signupUser.user_metadata?.full_name || fullName.trim();
      res.status(201).json({ success: true, confirmationRequired: false, token: authData.access_token, user: profile });
    } catch (error) {
      res.status(503).json({ success: false, error: error instanceof Error ? error.message : 'Account creation is unavailable.' });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      const { url, anonKey, serviceKey } = supabaseConfig();
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) return res.status(401).json({ success: false, error: 'Sign in required.' });
      const authResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
      if (!authResponse.ok) return res.status(401).json({ success: false, error: 'Session expired.' });
      const authUser = await authResponse.json() as { id: string; email?: string; email_confirmed_at?: string | null };
      const profile = await getProfile(authUser.id, serviceKey, url);
      if (!profile) return res.status(403).json({ success: false, error: 'Account profile is missing.' });
      if (profile.isFlagged) return res.status(403).json({ success: false, code: 'ACCOUNT_FLAGGED', error: 'This account is flagged for campus staff review. Contact the campus facilities team.' });
      if (!authUser.email_confirmed_at) return res.status(403).json({ success: false, error: 'Please confirm your email before using CampusFix.' });
      if (profile.role === 'staff' && !profile.staffApproved) return res.status(403).json({ success: false, error: 'Your staff account is awaiting administrator approval.' });
      profile.email = authUser.email || '';
      res.json({ success: true, user: profile });
    } catch (error) {
      res.status(503).json({ success: false, error: error instanceof Error ? error.message : 'Could not verify session.' });
    }
  });

  // Require a Supabase-verified account for all remaining API routes.
  app.use('/api', async (req, res, next) => {
    if (req.path === '/health' || req.path.startsWith('/auth/')) return next();
    try {
      const { url, anonKey, serviceKey } = supabaseConfig();
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) return res.status(401).json({ success: false, error: 'Sign in required.' });
      const authResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
      if (!authResponse.ok) return res.status(401).json({ success: false, error: 'Session expired. Sign in again.' });
      const authUser = await authResponse.json() as { id: string; email?: string; email_confirmed_at?: string | null };
      const profile = await getProfile(authUser.id, serviceKey, url);
      if (!profile) return res.status(403).json({ success: false, error: 'Account profile is missing.' });
      if (profile.isFlagged) return res.status(403).json({ success: false, code: 'ACCOUNT_FLAGGED', error: 'This account is flagged for campus staff review. Contact the campus facilities team.' });
      if (!authUser.email_confirmed_at) return res.status(403).json({ success: false, error: 'Please confirm your email before using CampusFix.' });
      if (profile.role === 'staff' && !profile.staffApproved) return res.status(403).json({ success: false, error: 'Your staff account is awaiting administrator approval.' });
      profile.email = authUser.email || '';
      (req as typeof req & { campusUser: CampusUser }).campusUser = profile;
      next();
    } catch (error) {
      res.status(503).json({ success: false, error: error instanceof Error ? error.message : 'Could not verify account.' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CampusFix AI',
      timestamp: new Date().toISOString(),
      hasGeminiApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
    });
  });

  // GET all tickets with filtering
  app.get('/api/tickets', async (req, res) => {
    try {
      let tickets = await dataStore.getAll();
      const campusUser = (req as typeof req & { campusUser?: CampusUser }).campusUser;
      if (campusUser?.role === 'student') {
        tickets = tickets.filter((ticket) => ticket.reporterId === campusUser.userId || ticket.trackedBy?.includes(campusUser.userId));
      }

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

  // Staff-only moderation queue for flagged accounts.
  app.get('/api/moderation/flags', async (req, res) => {
    const campusUser = (req as typeof req & { campusUser?: CampusUser }).campusUser;
    if (campusUser?.role !== 'staff' || !campusUser.staffApproved) return res.status(403).json({ success: false, error: 'Authorized campus staff only.' });
    try {
      const { url, serviceKey } = supabaseConfig();
      const response = await fetch(`${url}/rest/v1/profiles?is_flagged=eq.true&select=id,full_name,flag_reason,flagged_at&order=flagged_at.desc`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
      if (!response.ok) throw new Error('Could not load flagged accounts.');
      const flags = await response.json();
      res.json({ success: true, flags });
    } catch (err: any) {
      res.status(503).json({ success: false, error: err.message || 'Could not load flagged accounts.' });
    }
  });

  app.patch('/api/moderation/flags/:userId/clear', async (req, res) => {
    const campusUser = (req as typeof req & { campusUser?: CampusUser }).campusUser;
    if (campusUser?.role !== 'staff' || !campusUser.staffApproved) return res.status(403).json({ success: false, error: 'Authorized campus staff only.' });
    try {
      const { url, serviceKey } = supabaseConfig();
      const response = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(req.params.userId)}`, {
        method: 'PATCH',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ is_flagged: false, flag_reason: null, flagged_at: null }),
      });
      if (!response.ok) throw new Error('Could not clear the account flag.');
      res.json({ success: true });
    } catch (err: any) {
      res.status(503).json({ success: false, error: err.message || 'Could not clear account flag.' });
    }
  });

  // GET single ticket
  app.get('/api/tickets/:id', async (req, res) => {
    try {
      const ticket = await dataStore.getById(req.params.id);
      const campusUser = (req as typeof req & { campusUser?: CampusUser }).campusUser;
      if (ticket && campusUser?.role === 'student' && ticket.reporterId !== campusUser.userId && !ticket.trackedBy?.includes(campusUser.userId)) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }
      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }
      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST create ticket
  app.post('/api/tickets', async (req, res) => {
    try {
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
        requiresHumanReview,
        imageUrl,
        relatedTicketId,
        originalComplaint,
        conversationHistory,
      } = req.body;

      if (!issueSummary || !reportedLocation || !category) {
        return res.status(400).json({
          success: false,
          error: 'Missing required ticket fields: issueSummary, reportedLocation, and category are mandatory.',
        });
      }

      const campusUser = (req as typeof req & { campusUser?: CampusUser }).campusUser;
      if (campusUser?.role !== 'student') {
        return res.status(403).json({ success: false, error: 'Only signed-in student accounts can submit campus complaints.' });
      }
      let mustReview = !!requiresHumanReview;
      if (campusUser.role === 'student') {
        if (typeof originalComplaint !== 'string' || !originalComplaint.trim()) {
          return res.status(400).json({ success: false, error: 'Please analyze the original complaint before submitting it.' });
        }
        const studentMessages = [originalComplaint, ...(Array.isArray(conversationHistory) ? conversationHistory.filter((turn: any) => turn?.role === 'user').map((turn: any) => String(turn.content || '')) : [])].join(' ').toLowerCase();
        const explicitPrankAdmission = /\b(?:i|we)\s+(?:just\s+)?(?:made|make|invented)\s+(?:this|that|it|the report)\s+up\b|\b(?:this|that|it|the report)\s+(?:is|was)\s+(?:made up|fake|a prank)\b|\b(?:just|only)\s+(?:a\s+)?(?:prank|joke|fake report)\b|\bthere(?: is|'s) no (?:actual|real) (?:issue|problem|leak|damage)\b/.test(studentMessages);
        if (explicitPrankAdmission) {
          return res.status(422).json({ success: false, code: 'PRANK_REJECTED', error: 'This report says the issue was made up, so it was not submitted. Only report a real campus facilities issue.' });
        }
        const reportText = `Original student report:\n${originalComplaint.trim()}\nProposed ticket summary: ${String(issueSummary)}\nReported campus location: ${String(reportedLocation)}`;
        const history = Array.isArray(conversationHistory)
          ? conversationHistory.filter((turn: any) => turn?.role === 'user' || turn?.role === 'assistant').map((turn: any) => ({ role: turn.role, content: String(turn.content || '').slice(0, 2000) }))
          : [];
        const integrityCheck = await analyzeStudentComplaint(reportText, null, history);
        if (integrityCheck.reportIntegrity.verdict === 'out_of_scope' && integrityCheck.reportIntegrity.confidence >= 0.9) {
          return res.status(422).json({ success: false, code: 'REPORT_OUT_OF_SCOPE', error: 'CampusFix accepts campus facilities concerns only. This submission was not added as a ticket.' });
        }
        if (integrityCheck.reportIntegrity.verdict === 'clearly_fabricated' && integrityCheck.reportIntegrity.confidence >= 0.98) {
          return res.status(422).json({ success: false, code: 'PRANK_REJECTED', error: 'This appears to be a prank or fabricated report, so it was not submitted. Only report a real campus facilities issue.' });
        }
        if (integrityCheck.reportIntegrity.verdict === 'unclear' || (integrityCheck.reportIntegrity.verdict === 'out_of_scope' && integrityCheck.reportIntegrity.confidence < 0.9) || integrityCheck.requiresHumanReview) mustReview = true;
      }
      const ticket = await dataStore.create({
        reporterId: (req as typeof req & { campusUser?: CampusUser }).campusUser?.userId || reporterId,
        reporterName: (req as typeof req & { campusUser?: CampusUser }).campusUser?.name || reporterName,
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
        requiresHumanReview: mustReview,
        imageUrl,
        relatedTicketId,
      });

      res.status(201).json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // PATCH update ticket status (Staff only)
  app.patch('/api/tickets/:id/status', async (req, res) => {
    try {
      const { status, notes, resolutionNotes, assignedDepartment, staffNote } = req.body;
      const updatedBy = (req as typeof req & { campusUser?: CampusUser }).campusUser?.name || 'Campus Facility Staff';

      if (!status || !['Open', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid or missing status' });
      }

      // Strict server-side authorization: Reject non-staff requests
      if ((req as typeof req & { campusUser?: CampusUser }).campusUser?.role !== 'staff') {
        return res.status(403).json({
          success: false,
          error: 'Security Violation: Only authorized campus staff may transition ticket progress.',
        });
      }

      if (status === 'Resolved' && (!resolutionNotes || resolutionNotes.trim().length < 5)) {
        return res.status(400).json({
          success: false,
          error: 'Mandatory Requirement: Staff must enter concrete resolution notes before resolving a ticket.',
        });
      }

      // Update status in data store
      let ticket = await dataStore.updateStatus(
        req.params.id,
        status as TicketStatus,
        updatedBy || 'Campus Facility Staff',
        'staff',
        notes || `Status transitioned to ${status}`,
        resolutionNotes
      );

      // Reassign department if staff requested department change
      if (assignedDepartment && assignedDepartment !== ticket.assignedDepartment) {
        ticket = await dataStore.updateDepartment(
          req.params.id,
          assignedDepartment,
          updatedBy || 'Campus Facility Staff',
          'staff',
          `Department reassigned to ${assignedDepartment} along with status transition to ${status}.`
        );
      }

      // Add staff note if provided
      if (staffNote && staffNote.trim().length > 0) {
        ticket = await dataStore.addThreadNote(
          req.params.id,
          updatedBy || 'Campus Facility Staff',
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
  app.patch('/api/tickets/:id/department', async (req, res) => {
    try {
      const { department, notes } = req.body;
      const updatedBy = (req as typeof req & { campusUser?: CampusUser }).campusUser?.name || 'Campus Facility Staff';

      if ((req as typeof req & { campusUser?: CampusUser }).campusUser?.role !== 'staff') {
        return res.status(403).json({
          success: false,
          error: 'Security Violation: Only authorized campus staff may reassign ticket departments.',
        });
      }

      if (!department) {
        return res.status(400).json({ success: false, error: 'Missing department parameter.' });
      }

      const ticket = await dataStore.updateDepartment(
        req.params.id,
        department,
        updatedBy || 'Campus Facility Staff',
        'staff',
        notes
      );

      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST associate tracking to existing ticket
  app.post('/api/tickets/:id/track', async (req, res) => {
    try {
      const { studentNote } = req.body;
      const studentId = (req as typeof req & { campusUser?: CampusUser }).campusUser?.userId;
      if (!studentId) {
        return res.status(400).json({ success: false, error: 'studentId is required' });
      }

      const ticket = await dataStore.trackExistingTicket(req.params.id, studentId, studentNote);
      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST add comment note
  app.post('/api/tickets/:id/note', async (req, res) => {
    try {
      const { message } = req.body;
      const campusUser = (req as typeof req & { campusUser?: CampusUser }).campusUser;
      const author = campusUser?.name || 'CampusFix User';
      const role = campusUser?.role || 'student';
      if (!author || !message) {
        return res.status(400).json({ success: false, error: 'author and message are required' });
      }

      const ticket = await dataStore.addThreadNote(req.params.id, author, role || 'student', message);
      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST analyze complaint with Gemini
  app.post('/api/gemini/analyze', async (req, res) => {
    try {
      const { complaint, image, conversationHistory, validLocations } = req.body;

      if (!complaint && !image) {
        return res.status(400).json({ success: false, error: 'Please provide complaint text or a photograph' });
      }

      const result = await analyzeStudentComplaint(
        complaint || '',
        image,
        conversationHistory || [],
        validLocations
      );
      const campusUser = (req as typeof req & { campusUser?: CampusUser }).campusUser;
      const studentText = [complaint || '', ...(Array.isArray(conversationHistory) ? conversationHistory.filter((turn: any) => turn?.role === 'user').map((turn: any) => String(turn.content || '')) : [])].join(' ').toLowerCase();
      const explicitFabricationAdmission = /\b(?:i|we)\s+(?:just\s+)?(?:made|make|invented)\s+(?:this|that|it|the report)\s+up\b|\b(?:this|that|it|the report)\s+(?:is|was)\s+(?:made up|fake|a prank)\b|\b(?:just|only)\s+(?:a\s+)?(?:prank|joke|fake report)\b|\bthere(?: is|'s) no (?:actual|real) (?:issue|problem|leak|damage)\b/.test(studentText);
      if (result.reportIntegrity.verdict === 'out_of_scope' && result.reportIntegrity.confidence >= 0.9) {
        return res.status(422).json({ success: false, code: 'REPORT_OUT_OF_SCOPE', error: 'CampusFix accepts campus facilities concerns only. Please submit a real maintenance issue.' });
      }
      if (campusUser?.role === 'student' && explicitFabricationAdmission && (result.reportIntegrity.verdict === 'clearly_fabricated' || result.analysisSource === 'fallback')) {
        const { url, anonKey, serviceKey } = supabaseConfig();
        const reason = (result.reportIntegrity.evidenceReason || 'Report was classified as an explicit fabrication.').slice(0, 500);
        const flagResponse = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(campusUser.userId)}`, {
          method: 'PATCH',
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ is_flagged: true, flag_reason: reason, flagged_at: new Date().toISOString() }),
        });
        if (!flagResponse.ok) throw new Error('Could not save the report flag. Apply the CampusFix integrity migration and try again.');
        const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
        if (token) {
          const signOutResponse = await fetch(`${url}/auth/v1/logout?scope=global`, { method: 'POST', headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
          if (!signOutResponse.ok) console.warn('[CampusFix] Flag saved; Supabase global sign-out did not complete. Protected requests are blocked while flagged.');
        }
        return res.status(403).json({ success: false, code: 'REPORT_FLAGGED', error: 'Warning: your message explicitly says this report was made up. Your account has been flagged for campus staff review and signed out. Contact campus facilities if you believe this is a mistake.' });
      }
      if (result.reportIntegrity.verdict === 'out_of_scope' && result.reportIntegrity.confidence < 0.9) {
        result.reportIntegrity = { ...result.reportIntegrity, verdict: 'unclear' };
      }
      if (result.reportIntegrity.verdict === 'clearly_fabricated' && !explicitFabricationAdmission) {
        return res.status(422).json({ success: false, code: 'PRANK_REJECTED', error: 'This appears to be a prank or fabricated report, so it was not submitted. Only report a real campus facilities issue.' });
      }
      if (result.reportIntegrity.verdict === 'unclear') {
        result.requiresHumanReview = true;
        if (!result.aiInferences.some((inference) => inference.toLowerCase().includes('integrity review'))) {
          result.aiInferences.push('Integrity review is unclear; staff must verify the report before dispatch. This is not an account flag.');
        }
      }
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

      const existingTickets = await dataStore.getAll();
      const duplicates = await detectDuplicateTickets(candidateTicket, existingTickets);

      res.json({ success: true, count: duplicates.length, duplicates });
    } catch (err: any) {
      console.error('Error in /api/gemini/check-duplicates:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST reset demo data
  app.post('/api/demo/reset', async (req, res) => {
    try {
      if ((req as typeof req & { campusUser?: CampusUser }).campusUser?.role !== 'staff') {
        return res.status(403).json({ success: false, error: 'Only approved staff can remove demo records.' });
      }
      const tickets = await dataStore.resetDemoData();
      res.json({ success: true, message: 'Demo records removed; real student submissions were preserved.', tickets });
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
