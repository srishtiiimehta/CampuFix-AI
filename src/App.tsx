import React, { useState, useEffect, useCallback } from 'react';
import { 
  Ticket, 
  AnalysisResult, 
  ClarificationMessage, 
  DuplicateMatch, 
  TicketCategory, 
  TicketPriority, 
  TicketStatus 
} from './types/ticket';
import { 
  fetchTickets, 
  fetchTicketById, 
  createTicket, 
  updateTicketStatus, 
  trackExistingTicket, 
  addTicketNote, 
  analyzeWithGemini, 
  checkDuplicatesWithGemini, 
  resetDemoData 
} from './services/api';
import { Navbar, ActivePage, UserRole } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { NewComplaintForm } from './components/NewComplaintForm';
import { AIClarificationView } from './components/AIClarificationView';
import { TicketReviewCard } from './components/TicketReviewCard';
import { DuplicateReviewModal } from './components/DuplicateReviewModal';
import { TicketTrackingView } from './components/TicketTrackingView';
import { StaffDashboard } from './components/StaffDashboard';
import { StaffTicketDetailModal } from './components/StaffTicketDetailModal';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Navigation & User Session State
  const [activePage, setActivePage] = useState<ActivePage>('student_dashboard');
  const [userRole, setUserRole] = useState<UserRole>('student');
  const currentStudentId = 'stu_alex_c';
  const currentStudentName = 'Alex Chen (Sophomore)';
  const currentStaffName = 'Marcus Vance (Facilities Lead)';

  // App Data State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);

  // Gemini Submission & Clarification Flow State
  const [complaintText, setComplaintText] = useState('');
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [clarificationMessages, setClarificationMessages] = useState<ClarificationMessage[]>([]);

  // Duplicate Check Flow State
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [candidateTicketData, setCandidateTicketData] = useState<{
    category: TicketCategory;
    issueSummary: string;
    reportedLocation: string;
    priority: TicketPriority;
    studentProvidedFacts: string[];
    visualObservations: string[];
    aiInferences: string[];
    isSafetyHazard: boolean;
    safetyWarning?: string;
  } | null>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Staff Modal State
  const [staffModalTicket, setStaffModalTicket] = useState<Ticket | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Global Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Load all tickets from server
  const loadTickets = useCallback(async () => {
    try {
      setIsLoadingTickets(true);
      const list = await fetchTickets();
      setTickets(list);
    } catch (err: any) {
      console.error('Failed to load tickets:', err);
      showToast('Could not fetch tickets from backend', 'error');
    } finally {
      setIsLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Handler: Reset Demo Data
  const handleResetDemo = async () => {
    try {
      setIsResettingDemo(true);
      const refreshed = await resetDemoData();
      setTickets(refreshed);
      showToast('Demonstration dataset reset to initial state with 4 sample tickets');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset demo data', 'error');
    } finally {
      setIsResettingDemo(false);
    }
  };

  // Handler: Step 1 Submit Informal Complaint
  const handleStartAnalysis = async (
    text: string,
    img?: { base64: string; mimeType: string } | null
  ) => {
    setComplaintText(text);
    setImageData(img || null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeWithGemini(text, img, []);
      setAnalysisResult(result);

      const initialMsgs: ClarificationMessage[] = [
        {
          id: `msg-${Date.now()}-1`,
          role: 'user',
          content: text || 'Uploaded photo for facility defect diagnosis.',
          timestamp: new Date().toISOString(),
        },
      ];

      if (result.isMissingEssentialInfo && result.clarificationQuestion) {
        initialMsgs.push({
          id: `msg-${Date.now()}-2`,
          role: 'assistant',
          content: result.clarificationQuestion,
          timestamp: new Date().toISOString(),
          isQuestion: true,
        });
        setClarificationMessages(initialMsgs);
        setActivePage('clarification');
      } else {
        initialMsgs.push({
          id: `msg-${Date.now()}-2`,
          role: 'assistant',
          content: `Complaint parsed. Category: ${result.category} (${result.assignedDepartment}). Location: ${result.reportedLocation || 'Confirmed'}. All essential details are captured.`,
          timestamp: new Date().toISOString(),
        });
        setClarificationMessages(initialMsgs);
        setActivePage('review_confirm');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to analyze complaint', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler: Step 2 Student Replies to Clarification Question
  const handleSendClarification = async (studentReply: string) => {
    if (!analysisResult) return;

    const updatedHistory: ClarificationMessage[] = [
      ...clarificationMessages,
      {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: studentReply,
        timestamp: new Date().toISOString(),
      },
    ];
    setClarificationMessages(updatedHistory);
    setIsAnalyzing(true);

    try {
      const formattedHistory = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call Gemini with full preserved context and the latest reply
      const combinedPrompt = `${complaintText}. Additional details: ${studentReply}`;
      const updatedResult = await analyzeWithGemini(
        combinedPrompt,
        imageData,
        formattedHistory
      );

      setAnalysisResult(updatedResult);

      if (updatedResult.isMissingEssentialInfo && updatedResult.clarificationQuestion) {
        setClarificationMessages([
          ...updatedHistory,
          {
            id: `msg-${Date.now()}-ai`,
            role: 'assistant',
            content: updatedResult.clarificationQuestion,
            timestamp: new Date().toISOString(),
            isQuestion: true,
          },
        ]);
      } else {
        setClarificationMessages([
          ...updatedHistory,
          {
            id: `msg-${Date.now()}-ai`,
            role: 'assistant',
            content: 'Thank you! Location and problem specifics confirmed. Generating structured ticket for your review.',
            timestamp: new Date().toISOString(),
          },
        ]);
        setActivePage('review_confirm');
      }
    } catch (err: any) {
      showToast(err.message || 'Clarification failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler: Step 3 Review & Trigger Duplicate Check
  const handleReviewProceed = async (confirmedTicket: {
    category: TicketCategory;
    issueSummary: string;
    reportedLocation: string;
    priority: TicketPriority;
    studentProvidedFacts: string[];
    visualObservations: string[];
    aiInferences: string[];
    isSafetyHazard: boolean;
    safetyWarning?: string;
  }) => {
    setCandidateTicketData(confirmedTicket);
    setIsCheckingDuplicates(true);

    try {
      const dups = await checkDuplicatesWithGemini({
        category: confirmedTicket.category,
        reportedLocation: confirmedTicket.reportedLocation,
        issueSummary: confirmedTicket.issueSummary,
        details: confirmedTicket.studentProvidedFacts.join('; '),
      });

      setDuplicates(dups);
      setActivePage('duplicate_review');
    } catch (err: any) {
      console.error('Duplicate check error:', err);
      setDuplicates([]);
      setActivePage('duplicate_review');
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Handler: Step 4A Student Chooses to Track Existing Duplicate
  const handleTrackExisting = async (existingTicketId: string) => {
    try {
      setIsSubmittingTicket(true);
      const studentNote = `Student ${currentStudentName} joined tracking updates for this issue. Original complaint: "${candidateTicketData?.issueSummary}"`;
      const updated = await trackExistingTicket(existingTicketId, currentStudentId, studentNote);

      await loadTickets();
      setSelectedTicketId(existingTicketId);
      setActivePage('ticket_tracking');
      showToast(`Subscribed to tracking updates on ticket ${existingTicketId}!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to link ticket', 'error');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Handler: Step 4B Submit as Separate New Ticket
  const handleSubmitSeparateTicket = async () => {
    if (!candidateTicketData) return;

    try {
      setIsSubmittingTicket(true);
      const created = await createTicket({
        reporterId: currentStudentId,
        reporterName: currentStudentName,
        category: candidateTicketData.category,
        issueSummary: candidateTicketData.issueSummary,
        reportedLocation: candidateTicketData.reportedLocation,
        priority: candidateTicketData.priority,
        imageObservations: analysisResult?.imageObservations || '',
        studentProvidedFacts: candidateTicketData.studentProvidedFacts,
        visualObservations: candidateTicketData.visualObservations,
        aiInferences: candidateTicketData.aiInferences,
        isSafetyHazard: candidateTicketData.isSafetyHazard,
        safetyWarning: candidateTicketData.safetyWarning,
        imageUrl: imageData?.base64,
        relatedTicketId: duplicates.length > 0 ? duplicates[0].ticket.ticketId : undefined,
      });

      await loadTickets();
      setSelectedTicketId(created.ticketId);
      setActivePage('ticket_tracking');
      showToast(`Work order ${created.ticketId} created successfully! Dispatched to ${created.assignedDepartment}.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create ticket', 'error');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Handler: Add Discussion Note to Ticket
  const handleAddTicketNote = async (ticketId: string, message: string) => {
    try {
      const author = userRole === 'staff' ? currentStaffName : currentStudentName;
      const updated = await addTicketNote(ticketId, author, userRole, message);
      setTickets((prev) => prev.map((t) => (t.ticketId === ticketId ? updated : t)));
      showToast('Field note added to ticket history');
    } catch (err: any) {
      showToast(err.message || 'Failed to add note', 'error');
    }
  };

  // Handler: Staff Status Update
  const handleStaffUpdateStatus = async (
    ticketId: string,
    newStatus: TicketStatus,
    notes: string,
    resolutionNotes?: string
  ) => {
    try {
      setIsUpdatingStatus(true);
      const updated = await updateTicketStatus(ticketId, {
        status: newStatus,
        updatedBy: currentStaffName,
        role: 'staff',
        notes,
        resolutionNotes,
      });

      setTickets((prev) => prev.map((t) => (t.ticketId === ticketId ? updated : t)));
      showToast(`Ticket ${ticketId} updated to ${newStatus}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const selectedTicket = tickets.find((t) => t.ticketId === selectedTicketId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased">
      {/* Universal Top Bar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        userRole={userRole}
        setUserRole={setUserRole}
        onResetDemoData={handleResetDemo}
        isResetting={isResettingDemo}
        selectedTicketId={selectedTicketId}
      />

      {/* Floating Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-short">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View 1: Student Dashboard */}
        {activePage === 'student_dashboard' && (
          <StudentDashboard
            tickets={tickets}
            currentStudentId={currentStudentId}
            onNewComplaint={() => setActivePage('new_complaint')}
            onSelectTicket={(id) => {
              setSelectedTicketId(id);
              setActivePage('ticket_tracking');
            }}
          />
        )}

        {/* View 2: New Complaint Submission Form */}
        {activePage === 'new_complaint' && (
          <NewComplaintForm
            onSubmit={handleStartAnalysis}
            isLoading={isAnalyzing}
            onCancel={() => setActivePage('student_dashboard')}
          />
        )}

        {/* View 3: AI Clarification Conversation */}
        {activePage === 'clarification' && analysisResult && (
          <AIClarificationView
            currentAnalysis={analysisResult}
            messages={clarificationMessages}
            onSendMessage={handleSendClarification}
            isLoading={isAnalyzing}
            onProceedToReview={() => setActivePage('review_confirm')}
            onRestart={() => setActivePage('new_complaint')}
          />
        )}

        {/* View 4: Ticket Review and Confirmation */}
        {activePage === 'review_confirm' && analysisResult && (
          <TicketReviewCard
            analysis={analysisResult}
            imageUrl={imageData?.base64}
            onConfirm={handleReviewProceed}
            isCheckingDuplicates={isCheckingDuplicates}
            onBackToEdit={() => setActivePage('clarification')}
          />
        )}

        {/* View 5: Duplicate Review */}
        {activePage === 'duplicate_review' && candidateTicketData && (
          <DuplicateReviewModal
            duplicates={duplicates}
            candidateTicket={candidateTicketData}
            onTrackExisting={handleTrackExisting}
            onSubmitSeparate={handleSubmitSeparateTicket}
            onCancel={() => setActivePage('review_confirm')}
            isSubmitting={isSubmittingTicket}
          />
        )}

        {/* View 6: Ticket Tracking & Status History */}
        {activePage === 'ticket_tracking' && selectedTicket && (
          <TicketTrackingView
            ticket={selectedTicket}
            currentUserRole={userRole}
            currentUserName={userRole === 'staff' ? currentStaffName : currentStudentName}
            onBack={() => setActivePage(userRole === 'staff' ? 'staff_dashboard' : 'student_dashboard')}
            onAddNote={handleAddTicketNote}
            isAddingNote={false}
            onOpenStaffControls={() => setStaffModalTicket(selectedTicket)}
          />
        )}

        {/* View 7: Staff Dashboard */}
        {activePage === 'staff_dashboard' && (
          <StaffDashboard
            tickets={tickets}
            onOpenTicketDetails={(t) => setStaffModalTicket(t)}
            onViewStudentTracking={(id) => {
              setSelectedTicketId(id);
              setActivePage('ticket_tracking');
            }}
          />
        )}

        {/* Staff Ticket Details & Resolution Controls Modal */}
        {staffModalTicket && (
          <StaffTicketDetailModal
            ticket={staffModalTicket}
            onClose={() => setStaffModalTicket(null)}
            onUpdateStatus={handleStaffUpdateStatus}
            isUpdating={isUpdatingStatus}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">CampusFix AI</span>
            <span>—</span>
            <span>Intelligent University Maintenance Diagnostic & Work Order Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Gemini 3.8 Flash Multimodal Engine
            </span>
            <span>&copy; {new Date().getFullYear()} University Facilities Operations</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
