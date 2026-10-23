import { dataStore } from '../server/dataStore.ts';
import type { TicketStatus } from '../src/types/ticket.ts';

async function runE2EWorkflowTest() {
  console.log('====================================================');
  console.log('CampusFix AI: End-to-End Staff Workflow Audit Test');
  console.log('====================================================\n');

  let passedSteps = 0;
  const totalSteps = 8;

  try {
    // Step 1: Submit a student complaint
    console.log('Step 1: Submitting student complaint...');
    const testComplaint = {
      reporterId: 'stu_emma_99',
      reporterName: 'Emma Watson (Junior)',
      category: 'Plumbing' as const,
      issueSummary: 'Water pipe leaking under washbasin in Science Complex B 3rd floor',
      reportedLocation: 'Science Complex B - Room 302',
      priority: 'High' as const,
      studentProvidedFacts: [
        'Water pipe leaking under washbasin in Science Complex B 3rd floor',
        'Small puddle forming near entrance door',
      ],
      visualObservations: [
        'Visible continuous drip from pipe P-trap coupling',
      ],
      aiInferences: [
        'High priority: Prevent water pooling from seeping into lower electrical risers',
      ],
      isSafetyHazard: false,
    };

    const createdTicket = dataStore.create(testComplaint);
    if (!createdTicket || !createdTicket.ticketId) {
      throw new Error('Failed to create ticket in Step 1');
    }
    console.log(`  ✓ Ticket created with ID: ${createdTicket.ticketId}`);
    passedSteps++;

    // Step 2: Confirm the ticket is saved
    console.log('\nStep 2: Confirming ticket is saved in database...');
    const savedTicket = dataStore.getById(createdTicket.ticketId);
    if (!savedTicket) {
      throw new Error(`Ticket ${createdTicket.ticketId} not found in database`);
    }
    if (savedTicket.status !== 'Open') {
      throw new Error(`Expected initial status 'Open', got '${savedTicket.status}'`);
    }
    console.log(`  ✓ Confirmed ticket exists in database with status: ${savedTicket.status}`);
    console.log(`  ✓ Assigned Department: ${savedTicket.assignedDepartment}`);
    passedSteps++;

    // Step 3: Open the ticket in the staff dashboard
    console.log('\nStep 3: Opening ticket in staff dashboard context...');
    const allTickets = dataStore.getAll();
    const staffViewTicket = allTickets.find((t) => t.ticketId === createdTicket.ticketId);
    if (!staffViewTicket) {
      throw new Error('Ticket not visible in staff dashboard ticket list');
    }
    console.log(`  ✓ Staff loaded ticket ${staffViewTicket.ticketId} reported by ${staffViewTicket.reporterName}`);
    passedSteps++;

    // Step 4: Set it to In Progress
    console.log('\nStep 4: Transitioning status to "In Progress"...');
    const inProgressTicket = dataStore.updateStatus(
      createdTicket.ticketId,
      'In Progress',
      'Marcus Vance (Facilities Lead)',
      'staff',
      'Dispatched campus plumbing technician team with replacement PVC fittings.'
    );
    if (inProgressTicket.status !== 'In Progress') {
      throw new Error(`Expected status 'In Progress', got '${inProgressTicket.status}'`);
    }
    console.log(`  ✓ Status updated to: ${inProgressTicket.status}`);
    passedSteps++;

    // Step 5: Add a staff update
    console.log('\nStep 5: Adding a staff update field note...');
    const ticketWithNote = dataStore.addThreadNote(
      createdTicket.ticketId,
      'Marcus Vance (Facilities Lead)',
      'staff',
      'Plumbing crew on site at 09:30 AM; isolated isolation valve; replacing compromised rubber seal.'
    );
    const addedNote = ticketWithNote.notesThread?.find(
      (n) => n.role === 'staff' && n.message.includes('Plumbing crew on site')
    );
    if (!addedNote) {
      throw new Error('Staff update note was not found in ticket thread');
    }
    console.log(`  ✓ Staff note recorded: "${addedNote.message}"`);
    passedSteps++;

    // Step 6: Mark it Resolved with resolution notes
    console.log('\nStep 6: Marking ticket Resolved with mandatory resolution notes...');
    const resolutionText =
      'Replaced degraded P-trap compression gasket on sink #3. Pressure tested lines at 50 PSI for 15 minutes. No further leakage detected. Area sanitized and dried.';
    const resolvedTicket = dataStore.updateStatus(
      createdTicket.ticketId,
      'Resolved',
      'Marcus Vance (Facilities Lead)',
      'staff',
      'Work verified and completed by senior campus technician.',
      resolutionText
    );
    if (resolvedTicket.status !== 'Resolved') {
      throw new Error(`Expected status 'Resolved', got '${resolvedTicket.status}'`);
    }
    if (!resolvedTicket.resolutionNotes || resolvedTicket.resolutionNotes !== resolutionText) {
      throw new Error('Resolution notes were not properly saved');
    }
    console.log(`  ✓ Ticket marked Resolved!`);
    console.log(`  ✓ Resolution Notes: "${resolvedTicket.resolutionNotes}"`);
    passedSteps++;

    // Step 7: Open the student tracking page
    console.log('\nStep 7: Opening student tracking page (re-fetching record)...');
    const studentView = dataStore.getById(createdTicket.ticketId);
    if (!studentView) {
      throw new Error('Could not retrieve ticket for student tracking view');
    }
    console.log(`  ✓ Student tracking page retrieved record for ${studentView.ticketId}`);
    passedSteps++;

    // Step 8: Verify that the student sees the final status and resolution notes
    console.log('\nStep 8: Verifying student sees final status and resolution notes...');
    if (studentView.status !== 'Resolved') {
      throw new Error(`Student view shows incorrect status: ${studentView.status}`);
    }
    if (!studentView.resolutionNotes || studentView.resolutionNotes !== resolutionText) {
      throw new Error('Student view does not have the expected resolution notes');
    }

    // Verify audit trail contains staff actor and timestamps
    const resolveHistoryItem = studentView.statusHistory.find(
      (h) => h.status === 'Resolved' && h.role === 'staff'
    );
    if (!resolveHistoryItem) {
      throw new Error('Resolution history audit item not found in statusHistory');
    }
    if (!resolveHistoryItem.timestamp || !resolveHistoryItem.updatedBy) {
      throw new Error('Audit trail item missing timestamp or updatedBy');
    }

    console.log(`  ✓ Student view verified: status = "Resolved"`);
    console.log(`  ✓ Student view verified: resolutionNotes = "${studentView.resolutionNotes}"`);
    console.log(`  ✓ Audit Trail verified: signed off by ${resolveHistoryItem.updatedBy} at ${resolveHistoryItem.timestamp}`);
    passedSteps++;

    console.log('\n====================================================');
    console.log(`TEST PASSED: All ${passedSteps}/${totalSteps} End-to-End Steps Verified Successfully!`);
    console.log('====================================================\n');
  } catch (err: any) {
    console.error(`\n❌ TEST FAILED at step ${passedSteps + 1}:`, err.message);
    process.exit(1);
  }
}

runE2EWorkflowTest();
