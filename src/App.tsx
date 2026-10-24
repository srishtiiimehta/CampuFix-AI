import React, { useState, useEffect, useCallback } from 'react';

import { 

  Ticket, 

  AnalysisResult, 

  ClarificationMessage, 

  DuplicateMatch, 

  TicketCategory, 

  TicketPriority, 

  TicketStatus,

  DepartmentName

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

import { Navbar, type ActivePage } from './components/Navbar';

import { LoginScreen } from './components/LoginScreen';

import { fetchCurrentUser, logout, type AuthUser } from './services/api';

import { StudentDashboard } from './components/StudentDashboard';

import { NewComplaintForm } from './components/NewComplaintForm';

import { AIClarificationView } from './components/AIClarificationView';

import { TicketReviewCard } from './components/TicketReviewCard';

import { DuplicateReviewModal } from './components/DuplicateReviewModal';

import { TicketTrackingView } from './components/TicketTrackingView';

import { StaffDashboard } from './components/StaffDashboard';

import { StaffTicketDetailModal } from './components/StaffTicketDetailModal';

import { E2ETestModal } from './components/E2ETestModal';

import { AlertCircle, CheckCircle2 } from 'lucide-react';



export default function App() {

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = window.localStorage.getItem('campusfix-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('campusfix-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');

  // Navigation & User Session State

  const [activePage, setActivePage] = useState<ActivePage>('student_dashboard');

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const userRole = currentUser?.role ?? 'student';

  const currentStudentId = currentUser?.userId ?? '';

  const currentStudentName = currentUser?.name ?? '';

  const currentStaffName = currentUser?.name ?? '';



  useEffect(() => {

    fetchCurrentUser().then(setCurrentUser).finally(() => setIsCheckingAuth(false));

  }, []);



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

    requiresHumanReview?: boolean;

  } | null>(null);

  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);



  // Staff Modal State

  const [staffModalTicket, setStaffModalTicket] = useState<Ticket | null>(null);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isE2EModalOpen, setIsE2EModalOpen] = useState(false);

  const [isRefreshingTicket, setIsRefreshingTicket] = useState(false);



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

    if (currentUser) loadTickets();

  }, [loadTickets, currentUser]);

  // Keep a student's complaint list and status history current while staff work on tickets.
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') return;

    let refreshing = false;
    const refreshStudentTickets = async () => {
      if (refreshing || document.visibilityState === 'hidden') return;
      refreshing = true;
      try {
        setTickets(await fetchTickets());
      } catch (error) {
        console.error('Could not refresh student complaint history:', error);
      } finally {
        refreshing = false;
      }
    };

    const interval = window.setInterval(refreshStudentTickets, 8000);
    window.addEventListener('focus', refreshStudentTickets);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshStudentTickets);
    };
  }, [currentUser]);



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

      if (err?.code === 'REPORT_FLAGGED' || err?.code === 'ACCOUNT_FLAGGED') {
        logout();
        setCurrentUser(null);
        setTickets([]);
        setActivePage('student_dashboard');
        window.alert(err.message || 'Your account is flagged for campus staff review and has been signed out.');
      } else {
        showToast(err.message || 'Failed to analyze complaint', 'error');
      }

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

    requiresHumanReview?: boolean;

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

        originalComplaint: complaintText || clarificationMessages.filter((message) => message.role === 'user').map((message) => message.content).join(' '),

        conversationHistory: clarificationMessages.map(({ role, content }) => ({ role, content })),

        category: candidateTicketData.category,

        issueSummary: candidateTicketData.issueSummary,

        reportedLocation: candidateTicketData.reportedLocation,

        priority: candidateTicketData.priority,

        imageObservations: analysisResult?.imageObservations || '',

        studentProvidedFacts: candidateTicketData.studentProvidedFacts,

        visualObservations: candidateTicketData.visualObservations,

        aiInferences: candidateTicketData.aiInferences,

        isSafetyHazard: candidateTicketData.isSafetyHazard,

        requiresHumanReview: candidateTicketData.requiresHumanReview,

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



  // Handler: Staff Status & Ticket Management Update

  const handleStaffUpdateStatus = async (

    ticketId: string,

    newStatus: TicketStatus,

    notes: string,

    resolutionNotes?: string,

    assignedDepartment?: DepartmentName,

    staffNote?: string

  ) => {

    try {

      setIsUpdatingStatus(true);

      const updated = await updateTicketStatus(ticketId, {

        status: newStatus,

        updatedBy: currentStaffName,

        role: 'staff',

        notes,

        resolutionNotes,

        assignedDepartment,

        staffNote,

      });



      setTickets((prev) => prev.map((t) => (t.ticketId === ticketId ? updated : t)));

      setStaffModalTicket(null);

      showToast(`Work order ${ticketId} updated to ${newStatus}${assignedDepartment ? ` (${assignedDepartment})` : ''}!`);

    } catch (err: any) {

      showToast(err.message || 'Failed to update ticket status', 'error');

      throw err;

    } finally {

      setIsUpdatingStatus(false);

    }

  };



  // Handler: Student / Viewer Refresh Ticket

  const handleRefreshTicket = async (ticketId: string) => {

    try {

      setIsRefreshingTicket(true);

      const fresh = await fetchTicketById(ticketId);

      setTickets((prev) => prev.map((t) => (t.ticketId === ticketId ? fresh : t)));

      showToast(`Refreshed live status for ticket ${ticketId}`);

    } catch (err: any) {

      showToast('Could not refresh ticket from server', 'error');

    } finally {

      setIsRefreshingTicket(false);

    }

  };



  const selectedTicket = tickets.find((t) => t.ticketId === selectedTicketId);



  if (isCheckingAuth) return <div className="min-h-screen grid place-items-center text-sm text-slate-500">Loading session...</div>;

  if (!currentUser) return <LoginScreen onLoginSuccess={setCurrentUser} />;



  return (

    <div className="app-shell min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased">

      {/* Universal Top Bar */}

      <Navbar

        activePage={activePage}

        setActivePage={setActivePage}

        currentUser={currentUser}

        onLogout={() => { logout(); setCurrentUser(null); setTickets([]); setActivePage('student_dashboard'); }}

        onResetDemoData={handleResetDemo}

        isResetting={isResettingDemo}

        selectedTicketId={selectedTicketId}
        isDarkMode={theme === 'dark'}
        onToggleTheme={toggleTheme}

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
        <div key={activePage} className="page-transition">
        {/* View 1: Student Dashboard */}

        {activePage === 'student_dashboard' && (

          <StudentDashboard

            currentStudentName={currentStudentName}

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

        {activePage === 'clarification' && (

          analysisResult ? (

            <AIClarificationView

              currentUserName={currentStudentName}

              currentAnalysis={analysisResult}

              messages={clarificationMessages}

              originalComplaint={complaintText}

              imageUrl={imageData?.base64}

              onSendMessage={handleSendClarification}

              isLoading={isAnalyzing}

              onProceedToReview={() => setActivePage('review_confirm')}

              onRestart={() => setActivePage('new_complaint')}

            />

          ) : (

            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">

              <h3 className="text-sm font-bold text-slate-900">No Active Complaint in Session</h3>

              <p className="text-xs text-slate-500">Please describe your maintenance problem to start AI clarification.</p>

              <button

                onClick={() => setActivePage('new_complaint')}

                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"

              >

                Report New Problem

              </button>

            </div>

          )

        )}



        {/* View 4: Ticket Review and Confirmation */}

        {activePage === 'review_confirm' && (

          analysisResult ? (

            <TicketReviewCard

              analysis={analysisResult}

              imageUrl={imageData?.base64}

              onConfirm={handleReviewProceed}

              isCheckingDuplicates={isCheckingDuplicates}

              onBackToEdit={() => setActivePage('clarification')}

            />

          ) : (

            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">

              <h3 className="text-sm font-bold text-slate-900">No Ticket Available for Review</h3>

              <p className="text-xs text-slate-500">Please start a new complaint to generate ticket details.</p>

              <button

                onClick={() => setActivePage('new_complaint')}

                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"

              >

                Start New Complaint

              </button>

            </div>

          )

        )}



        {/* View 5: Duplicate Review */}

        {activePage === 'duplicate_review' && (

          candidateTicketData ? (

            <DuplicateReviewModal

              duplicates={duplicates}

              candidateTicket={candidateTicketData}

              onTrackExisting={handleTrackExisting}

              onSubmitSeparate={handleSubmitSeparateTicket}

              onCancel={() => setActivePage('review_confirm')}

              isSubmitting={isSubmittingTicket}

            />

          ) : (

            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">

              <h3 className="text-sm font-bold text-slate-900">No Ticket Candidate to Check</h3>

              <p className="text-xs text-slate-500">Please start a complaint to check for duplicate records.</p>

              <button

                onClick={() => setActivePage('new_complaint')}

                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"

              >

                Start New Complaint

              </button>

            </div>

          )

        )}



        {/* View 6: Ticket Tracking & Status History */}

        {activePage === 'ticket_tracking' && (

          selectedTicket ? (

            <TicketTrackingView

              ticket={selectedTicket}

              currentUserRole={userRole}

              currentUserName={userRole === 'staff' ? currentStaffName : currentStudentName}

              onBack={() => setActivePage(userRole === 'staff' ? 'staff_dashboard' : 'student_dashboard')}

              onAddNote={handleAddTicketNote}

              isAddingNote={false}

              onOpenStaffControls={() => setStaffModalTicket(selectedTicket)}

              onRefreshTicket={() => handleRefreshTicket(selectedTicket.ticketId)}

              isRefreshing={isRefreshingTicket}

            />

          ) : (

            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">

              <h3 className="text-sm font-bold text-slate-900">No Ticket Selected</h3>

              <p className="text-xs text-slate-500">Select any ticket from your dashboard to view its tracking updates and audit trail.</p>

              <button

                onClick={() => setActivePage('student_dashboard')}

                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"

              >

                Go to Dashboard

              </button>

            </div>

          )

        )}



        {/* View 7: Staff Dashboard */}

        {activePage === 'staff_dashboard' && (

          <StaffDashboard

            currentUserName={currentStaffName}

            tickets={tickets}

            onOpenTicketDetails={(t) => setStaffModalTicket(t)}

            onViewStudentTracking={(id) => {

              setSelectedTicketId(id);

              setActivePage('ticket_tracking');

            }}

            onRunE2ETest={() => setIsE2EModalOpen(true)}

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



        {/* Automated E2E Audit Test Modal */}

        {isE2EModalOpen && (

          <E2ETestModal

            onClose={() => setIsE2EModalOpen(false)}

            onTestComplete={async (ticketId) => {

              await loadTickets();

              setSelectedTicketId(ticketId);

            }}

            onViewStudentTracking={(ticketId) => {

              setSelectedTicketId(ticketId);

              setUserRole('student');

              setActivePage('ticket_tracking');

            }}

          />

        )}
        </div>
      </main>



      {/* Footer */}

      <footer className="mt-auto border-t border-slate-200 bg-white py-6">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">

          <div className="flex items-center gap-2">

            <span className="font-bold text-slate-900">CampusFix AI</span>

            <span>â€”</span>

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

