import dotenv from 'dotenv';
dotenv.config();

import { 
  analyzeStudentComplaint, 
  generateLocalFallbackAnalysis, 
  GEMINI_MODELS 
} from '../server/geminiService.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

const SERVER_BASE = process.env.TEST_SERVER_URL || 'http://127.0.0.1:3000';

async function runE2EWorkflowTests() {
  console.log('====================================================');
  console.log('   CAMPUSFIX AI - COMPREHENSIVE E2E VERIFICATION    ');
  console.log('====================================================\n');

  // --- TEST SUITE 1: Model List Configuration ---
  console.log('--- Test Suite 1: Configurable Gemini Models ---');
  console.log(`Configured GEMINI_MODELS: [${GEMINI_MODELS.join(', ')}]`);
  assert(Array.isArray(GEMINI_MODELS), 'GEMINI_MODELS is exported as an array');
  assert(GEMINI_MODELS.length > 0, 'GEMINI_MODELS has at least one configured model');
  assert(!GEMINI_MODELS.includes('gemini-3.8-flash'), "GEMINI_MODELS does not default to 'gemini-3.8-flash'");
  console.log('Suite 1 passed.\n');

  // --- TEST SUITE 2: Fallback Path (Transparent Rule-Based Mode) ---
  console.log('--- Test Suite 2: Fallback Engine Verification ---');

  // 2A: Fallback with Image attached
  console.log('\n2A: Testing fallback with image attached...');
  const dummyPhoto = {
    base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    mimeType: 'image/png',
  };
  const fallbackWithImg = generateLocalFallbackAnalysis(
    'The sink in science lab 102 is leaking water onto the cabinet.',
    dummyPhoto,
    [],
    undefined,
    'Simulated API offline mode'
  );

  assert(fallbackWithImg.analysisSource === 'fallback', 'analysisSource is "fallback"');
  assert(fallbackWithImg.fallbackReason === 'Simulated API offline mode', 'fallbackReason is preserved');
  assert(fallbackWithImg.requiresHumanReview === true, 'requiresHumanReview is strictly TRUE in fallback mode');
  assert(fallbackWithImg.imageObservations === '', 'imageObservations is empty string in fallback mode (no fabricated AI claims)');
  assert(
    fallbackWithImg.visualObservations.length === 1 &&
    fallbackWithImg.visualObservations[0] === 'Photo attached; automated visual analysis unavailable. Technician review required.',
    'visualObservations contains only the honest disclaimer about automated visual analysis being unavailable'
  );
  assert(fallbackWithImg.category === 'Plumbing', 'Fallback accurately mapped category to Plumbing');
  assert(fallbackWithImg.assignedDepartment === 'Plumbing / Water Maintenance', 'Assigned department is Plumbing / Water Maintenance');

  // 2B: Fallback without image attached
  console.log('\n2B: Testing fallback without image attached...');
  const fallbackNoImg = generateLocalFallbackAnalysis(
    'Ceiling fan in room 204 stopped spinning.',
    null,
    [],
    undefined,
    'No image provided'
  );
  assert(fallbackNoImg.analysisSource === 'fallback', 'analysisSource is "fallback"');
  assert(fallbackNoImg.requiresHumanReview === true, 'requiresHumanReview is true');
  assert(fallbackNoImg.imageObservations === '', 'imageObservations is empty');
  assert(fallbackNoImg.visualObservations.length === 0, 'visualObservations is empty array when no photo was attached');
  assert(fallbackNoImg.category === 'Electricity', 'Mapped category to Electricity');
  assert(fallbackNoImg.assignedDepartment === 'Electrical Maintenance', 'Assigned department is Electrical Maintenance');

  // 2C: Fallback safety hazard detection
  console.log('\n2C: Testing fallback hazard detection...');
  const fallbackHazard = generateLocalFallbackAnalysis(
    'There are sparks coming from a switch on the wall!',
    null
  );
  assert(fallbackHazard.isSafetyHazard === true, 'isSafetyHazard is true for sparks');
  assert(fallbackHazard.priority === 'Critical', 'priority is Critical for sparks');
  assert(fallbackHazard.requiresHumanReview === true, 'requiresHumanReview is true');
  assert(fallbackHazard.category === 'Electricity', 'category is Electricity');

  // 2D: Fallback vague complaint
  console.log('\n2D: Testing fallback vague complaint clarification...');
  const fallbackVague = generateLocalFallbackAnalysis('Something is broken.');
  assert(fallbackVague.requiresHumanReview === true, 'requiresHumanReview is true for vague complaint');
  assert(fallbackVague.isMissingEssentialInfo === true, 'isMissingEssentialInfo is true');
  assert(typeof fallbackVague.clarificationQuestion === 'string' && fallbackVague.clarificationQuestion.length > 0, 'clarificationQuestion is provided');
  assert(typeof fallbackVague.missingInformation === 'string' && fallbackVague.missingInformation.length > 0, 'missingInformation describes what is needed');
  console.log('Suite 2 passed.\n');

  // --- TEST SUITE 3: Gemini Analysis Path (E2E Calling) ---
  console.log('--- Test Suite 3: Gemini Analysis Path (E2E Calling) ---');

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    console.log('⚠️ GEMINI_API_KEY not set or placeholder; verify that analyzeStudentComplaint routes safely to fallback.');
    const autoFallback = await analyzeStudentComplaint('The tap is leaking in the hostel washroom.');
    assert(autoFallback.analysisSource === 'fallback', 'Without key, analysisSource is fallback');
    assert(autoFallback.requiresHumanReview === true, 'Without key, requiresHumanReview is forced to true');
  } else {
    console.log('Calling analyzeStudentComplaint with live Gemini integration...');
    try {
      const geminiResult = await analyzeStudentComplaint('The bins near the cafeteria are overflowing.');
      console.log('Result source:', geminiResult.analysisSource);
      console.log('Result category:', geminiResult.category);
      console.log('Result department:', geminiResult.assignedDepartment);
      assert(
        geminiResult.analysisSource === 'gemini' || geminiResult.analysisSource === 'fallback',
        'analysisSource is either "gemini" or "fallback"'
      );
      assert(geminiResult.category === 'Cleanliness', 'Category is Cleanliness');
      assert(geminiResult.assignedDepartment === 'Housekeeping / Sanitation', 'Department mapped to Housekeeping / Sanitation');
      if (geminiResult.analysisSource === 'gemini') {
        assert(geminiResult.fallbackReason === undefined, 'fallbackReason is undefined on successful gemini call');
      } else {
        assert(typeof geminiResult.fallbackReason === 'string', 'fallbackReason is present on fallback path');
        assert(geminiResult.requiresHumanReview === true, 'requiresHumanReview is true on fallback path');
      }
    } catch (err: any) {
      console.error('Gemini call threw unexpected error:', err);
      throw err;
    }
  }
  console.log('Suite 3 passed.\n');

  // --- TEST SUITE 4: Authentication, Authorization & RBAC ---
  console.log('--- Test Suite 4: Authentication, Authorization & RBAC ---');

  // Check if live server is reachable
  let serverOnline = false;
  try {
    const healthRes = await fetch(`${SERVER_BASE}/api/health`);
    if (healthRes.ok) {
      serverOnline = true;
    }
  } catch {
    serverOnline = false;
  }

  if (!serverOnline) {
    console.warn(`Server at ${SERVER_BASE} is not running. Skipping live HTTP auth tests.`);
    return;
  }

  console.log(`Server online at ${SERVER_BASE}. Proceeding with live RBAC HTTP verification...`);

  // 4A: Login as Student
  console.log('\n4A: Logging in as Student (alex)...');
  const studentLoginRes = await fetch(`${SERVER_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'alex', password: 'student123' }),
  });
  assert(studentLoginRes.status === 200, 'Student login returned HTTP 200');
  const studentLoginData = await studentLoginRes.json();
  assert(typeof studentLoginData.token === 'string' && studentLoginData.token.length > 20, 'Student received signed JWT');
  assert(studentLoginData.user.role === 'student', 'Student user role is "student"');
  assert(studentLoginData.user.userId === 'stu_alex_c', 'Student userId is "stu_alex_c"');
  const studentToken = studentLoginData.token;

  // 4B: Login as Staff
  console.log('\n4B: Logging in as Staff (marcus)...');
  const staffLoginRes = await fetch(`${SERVER_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'marcus', password: 'staff123' }),
  });
  assert(staffLoginRes.status === 200, 'Staff login returned HTTP 200');
  const staffLoginData = await staffLoginRes.json();
  assert(typeof staffLoginData.token === 'string' && staffLoginData.token.length > 20, 'Staff received signed JWT');
  assert(staffLoginData.user.role === 'staff', 'Staff user role is "staff"');
  assert(staffLoginData.user.userId === 'staff_marcus_v', 'Staff userId is "staff_marcus_v"');
  const staffToken = staffLoginData.token;

  // 4C: Verify /api/auth/me session introspection
  console.log('\n4C: Testing /api/auth/me token introspection...');
  const meRes = await fetch(`${SERVER_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(meRes.status === 200, '/api/auth/me returns 200 with valid Bearer token');
  const meData = await meRes.json();
  assert(meData.user.userId === 'stu_alex_c', 'Decoded token reflects correct student userId');

  // 4D: Assert Student is FORBIDDEN (403) from calling PATCH /api/tickets/:id/status
  console.log('\n4D: Asserting Student receives 403 on staff status endpoint...');
  const studentStatusForbiddenRes = await fetch(`${SERVER_BASE}/api/tickets/TKT-DEMO-001/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      status: 'Resolved',
      resolutionNotes: 'Self-resolved by student',
    }),
  });
  assert(studentStatusForbiddenRes.status === 403, 'Student calling status endpoint strictly returns HTTP 403 Forbidden');
  const forbiddenStatusBody = await studentStatusForbiddenRes.json();
  assert(forbiddenStatusBody.error.includes('Only authorized staff'), 'Error explicitly states staff role requirement');

  // 4E: Assert Student is FORBIDDEN (403) from calling PATCH /api/tickets/:id/department
  console.log('\n4E: Asserting Student receives 403 on staff department endpoint...');
  const studentDeptForbiddenRes = await fetch(`${SERVER_BASE}/api/tickets/TKT-DEMO-001/department`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      department: 'Electrical Maintenance',
    }),
  });
  assert(studentDeptForbiddenRes.status === 403, 'Student calling department endpoint strictly returns HTTP 403 Forbidden');

  // 4F: Assert Staff can successfully update ticket status (200)
  console.log('\n4F: Asserting Staff can update ticket status...');
  const staffStatusRes = await fetch(`${SERVER_BASE}/api/tickets/TKT-DEMO-003/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      status: 'In Progress',
      notes: 'Assigned to senior electrician for ballast fixture replacement.',
    }),
  });
  assert(staffStatusRes.status === 200, 'Staff update returned HTTP 200');
  const updatedTicketData = await staffStatusRes.json();
  assert(updatedTicketData.ticket.status === 'In Progress', 'Ticket status updated to In Progress');
  const latestHistory = updatedTicketData.ticket.statusHistory.slice(-1)[0];
  assert(latestHistory.role === 'staff', 'Audit trail entry has role="staff"');
  assert(latestHistory.updatedBy === 'Marcus Vance (Facilities Lead)', 'Server derived updatedBy from token name');

  // 4G: Assert Student creating ticket cannot spoof reporterId (server derives from token)
  console.log('\n4G: Asserting server-side derivation of reporterId from token...');
  const createTicketRes = await fetch(`${SERVER_BASE}/api/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      category: 'Electricity',
      issueSummary: 'Flickering corridor lamp outside student lounge',
      reportedLocation: 'Student Union, 2nd Floor',
      priority: 'Low',
      studentProvidedFacts: ['Lamp flashes every few seconds'],
      visualObservations: [],
      aiInferences: [],
      // Attempt to spoof reporter identity in payload
      reporterId: 'malicious_impersonator',
      reporterName: 'Fake Dean',
    }),
  });
  assert(createTicketRes.status === 201, 'Student created ticket with HTTP 201');
  const createdTicket = (await createTicketRes.json()).ticket;
  assert(createdTicket.reporterId === 'stu_alex_c', 'reporterId derived strictly from token ("stu_alex_c"), ignoring payload spoofing');
  assert(createdTicket.reporterName === 'Alex Chen (Sophomore)', 'reporterName derived strictly from token');

  // 4H: Assert Rate Limiting headers on /api/gemini/analyze
  console.log('\n4H: Verifying Rate Limiter on /api/gemini/analyze...');
  const geminiRateLimitCheck = await fetch(`${SERVER_BASE}/api/gemini/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      complaintText: 'Broken desk leg',
    }),
  });
  // Should either succeed or rate-limit, but rate-limit headers must be present
  const ratelimitLimit = geminiRateLimitCheck.headers.get('ratelimit-limit');
  const ratelimitPolicy = geminiRateLimitCheck.headers.get('ratelimit-policy');
  assert(
    ratelimitLimit !== null || ratelimitPolicy !== null,
    'Rate limiting headers (ratelimit-limit / ratelimit-policy) are configured on /api/gemini/*'
  );

  console.log('Suite 4 passed.\n');

  console.log('====================================================');
  console.log('   🎉 ALL E2E WORKFLOW TESTS PASSED SUCCESSFULLY!    ');
  console.log('====================================================');
}

runE2EWorkflowTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
