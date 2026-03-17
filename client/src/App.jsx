// client/src/App.jsx
import React, { useContext, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { TasksProvider } from "./context/TasksContext";
import { BugsProvider } from "./context/BugsContext";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner, { PageLoader } from "./components/LoadingSpinner";
import PageLoaderWithCube from "./components/PageLoader";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import LeaderAuth from "./pages/LeaderAuth";
import LeaderSignup from "./pages/LeaderSignup";
import MemberAuth from "./pages/MemberAuth";
import MemberSignup from "./pages/MemberSignup";
import LeaderDashboard from "./pages/LeaderDashboard";
import MemberDashboard from "./pages/MemberDashboard";
import Profile from "./pages/Profile";
import RelaxGame from "./pages/RelaxGame";
import About from "./pages/About";

// Notifications
import NotificationBanner from './components/NotificationBanner';
import ThemeToggle from "./components/ThemeToggle";
import GlobalGlow from "./components/ui/GlobalGlow";

// Leader layout and modules
import LeaderLayout from "./layout/LeaderLayout";
import LeaderHome from "./pages/leader/LeaderHome";
import LeaderPlaceholder from "./pages/leader/LeaderPlaceholder";
import LeaderTasks from "./pages/leader/LeaderTasks";
import LeaderBugs from "./pages/leader/LeaderBugs";
import LeaderPerformance from "./pages/leader/LeaderPerformance";
import LeaderDeadlines from "./pages/leader/LeaderDeadlines";
import MemberDeadlines from "./pages/member/MemberDeadlines";
import MemberDocs from "./pages/member/MemberDocs";
import LeaderBugTracker from "./pages/leader/LeaderBugTracker";
import LeaderTaskManagement from "./pages/leader/LeaderTaskManagement";
import LeaderTeamSimple from "./pages/leader/LeaderTeamSimple";
import LeaderTeamManagement from "./pages/leader/LeaderTeamManagement";
import SimpleLanding from "./pages/SimpleLanding";
import SimpleLeaderAuth from "./pages/SimpleLeaderAuth";
import UnifiedAuth from "./pages/UnifiedAuth";
import ActivityTimelinePage from "./pages/ActivityTimelinePage";

// Member layout and modules
import MemberLayout from "./layout/MemberLayout";
import MemberHome from "./pages/member/MemberHome";
import MemberPlaceholder from "./pages/member/MemberPlaceholder";
import MemberBugs from "./pages/member/MemberBugs";
import MemberPerformance from "./pages/member/MemberPerformance";
import MemberTasks from "./pages/member/MemberTasks";
import TimeTracking from "./pages/member/TimeTracking";
import MemberGantt from "./pages/member/MemberGantt";
import MemberTeamJoin from "./pages/member/MemberTeamJoin";
import TeamChat from "./pages/member/TeamChat";
import MemberTransition from "./pages/member/MemberTransition";
import AiAssistant from "./pages/AiAssistant";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import DevTools from "./pages/DevTools";
import Whiteboard from "./pages/Whiteboard";

// ✅ Enhanced role-based route guard with better loading states
function RoleRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, token, isLoading, isInitializing, sessionRestored } = useContext(AuthContext);

  // Show enhanced loading during authentication initialization
  if (isInitializing || !sessionRestored) {
    return <PageLoader message="Initializing TaskHive..." showProgress={true} progress={30} />;
  }

  // Show loading while checking authentication
  if (isLoading) {
    return <PageLoader message="Verifying your session..." showProgress={true} progress={70} />;
  }

  if (!isAuthenticated || !token || !user) {
    // Redirect to unified auth page
    return <Navigate to="/auth?mode=login" replace />;
  }

  const userRole = user.role?.toLowerCase();
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect based on user's role
    if (userRole === "leader") {
      return <Navigate to="/leader/dashboard" replace />;
    } else if (userRole === "member") {
      return <Navigate to="/member/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

// Enhanced public route component that redirects authenticated users
function PublicRoute({ children }) {
  const { isAuthenticated, user, isInitializing, sessionRestored } = useContext(AuthContext);

  // Show loading during initialization
  if (isInitializing || !sessionRestored) {
    return <PageLoader message="Loading TaskHive..." showProgress={true} progress={50} />;
  }

  // Redirect authenticated users to their dashboard
  if (isAuthenticated && user) {
    const userRole = user.role?.toLowerCase();
    if (userRole === 'leader') {
      return <Navigate to="/leader/dashboard" replace />;
    } else if (userRole === 'member') {
      return <Navigate to="/member/dashboard" replace />;
    }
  }

  return children;
}

function AppRoutes() {
  const { isInitializing, sessionRestored } = useContext(AuthContext);

  // ✅ We temporarily disable socket initialization until the feature is added
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      console.log("Socket.io feature not yet initialized. Safe to ignore for now.");
      // Placeholder: When socket feature added later, uncomment below:
      // initSocket(token);
    }
  }, []);

  // Show initial loading screen while the app initializes
  if (isInitializing || !sessionRestored) {
    return <PageLoader message="Starting TaskHive..." showProgress={true} progress={20} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={
          <PublicRoute>
            <Home />
          </PublicRoute>
        } />
        <Route path="/about" element={<About />} />
        <Route path="/landing-original" element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        } />

        {/* Simple test route */}
        <Route path="/simple-test" element={
          <div className="min-h-screen bg-green-100 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-green-800 mb-4">Simple Test Route</h1>
              <p className="text-green-600">If you see this, basic routing is working!</p>
              <div className="mt-4 space-x-4">
                <a href="/leader-auth?mode=login" className="bg-blue-600 text-white px-4 py-2 rounded">Leader Login</a>
                <a href="/member-auth?mode=login" className="bg-purple-600 text-white px-4 py-2 rounded">Member Login</a>
              </div>
            </div>
          </div>
        } />

        {/* Unified Authentication Routes */}
        <Route path="/auth" element={
          <PublicRoute>
            <UnifiedAuth />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <UnifiedAuth />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <UnifiedAuth />
          </PublicRoute>
        } />

        {/* Leader Authentication Routes */}
        <Route path="/leader-auth" element={
          <PublicRoute>
            <LeaderAuth />
          </PublicRoute>
        } />
        <Route path="/leader-auth-simple" element={
          <PublicRoute>
            <SimpleLeaderAuth />
          </PublicRoute>
        } />
        <Route path="/leader-login" element={
          <PublicRoute>
            <LeaderAuth />
          </PublicRoute>
        } />
        <Route path="/leader-signup" element={
          <PublicRoute>
            <LeaderAuth />
          </PublicRoute>
        } />
        {/* Backwards-compatible and clean paths requested by UI */}
        <Route path="/leader/login" element={
          <PublicRoute>
            <LeaderAuth />
          </PublicRoute>
        } />
        <Route path="/leader/signup" element={
          <PublicRoute>
            <LeaderSignup />
          </PublicRoute>
        } />

        {/* Member Authentication Routes */}
        <Route path="/member-auth" element={
          <PublicRoute>
            <MemberAuth />
          </PublicRoute>
        } />
        <Route path="/member-login" element={
          <PublicRoute>
            <MemberAuth />
          </PublicRoute>
        } />
        <Route path="/member-signup" element={
          <PublicRoute>
            <MemberAuth />
          </PublicRoute>
        } />
        {/* Backwards-compatible and clean paths requested by UI */}
        <Route path="/member/login" element={
          <PublicRoute>
            <MemberAuth />
          </PublicRoute>
        } />
        <Route path="/member/signup" element={
          <PublicRoute>
            <MemberSignup />
          </PublicRoute>
        } />

        {/* Leader Dashboard Route */}
        <Route
          path="/leader/dashboard"
          element={
            <RoleRoute allowedRoles={["leader"]}>
              <LeaderDashboard />
            </RoleRoute>
          }
        />

        {/* Leader Dashboard Route (legacy - redirect to new structure) */}
        <Route
          path="/leader-dashboard"
          element={<Navigate to="/leader/dashboard" replace />}
        />

        {/* Leader area - new nested routes */}
        <Route path="/leader" element={<RoleRoute allowedRoles={["leader"]}><LeaderLayout /></RoleRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="performance" element={<LeaderPerformance />} />
          <Route path="documents" element={<MemberDocs />} />
          <Route path="deadlines" element={<LeaderDeadlines />} />
          <Route path="chat" element={<TeamChat />} />
          <Route path="team" element={<LeaderTeamManagement />} />
          <Route path="tasks" element={<LeaderTasks />} />
          <Route path="bugs" element={<LeaderBugs />} />
          <Route path="ai-assistant" element={<AiAssistant />} />
          <Route path="dev-tools" element={<DevTools />} />
          <Route path="whiteboard" element={<Whiteboard />} />
          <Route path="activity" element={<ActivityTimelinePage />} />
        </Route>

        {/* Direct test route without any protection */}
        <Route path="/team-direct-test" element={
          <div className="p-8 bg-blue-100 min-h-screen">
            <h1 className="text-3xl font-bold text-blue-800 mb-4">Direct Team Test</h1>
            <p className="text-blue-600">This has no role protection at all!</p>
            <p className="mt-2">If you see this, the issue is with RoleRoute.</p>
          </div>
        } />

        {/* Simple debug route */}
        <Route path="/debug" element={
          <div className="p-8 bg-red-100 min-h-screen">
            <h1 className="text-3xl font-bold text-red-800 mb-4">DEBUG ROUTE</h1>
            <p className="text-red-600">This route has no authentication or layout!</p>
            <p className="mt-2">If you see this, basic routing works.</p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/';
                }}
                className="bg-red-600 text-white px-4 py-2 rounded mr-4"
              >
                Clear All Data & Go Home
              </button>
              <div className="mt-4 p-4 bg-white rounded">
                <h3 className="font-bold">Current Storage:</h3>
                <p>localStorage: {JSON.stringify(Object.keys(localStorage))}</p>
                <p>sessionStorage: {JSON.stringify(Object.keys(sessionStorage))}</p>
              </div>
            </div>
          </div>
        } />
        {/* Member area - nested routes for members */}
        <Route path="/member" element={<RoleRoute allowedRoles={["member"]}><MemberLayout /></RoleRoute>}>
          {/* <Route path="dashboard" element={<MemberHome />} /> Conflicting with main dashboard */}
          <Route index element={<Navigate to="/member/dashboard" replace />} />
          <Route path="tasks" element={<MemberTasks />} />
          <Route path="time-tracking" element={<TimeTracking />} />
          <Route path="team" element={<MemberTeamJoin />} />
          <Route path="bugs" element={<MemberBugs />} />
          <Route path="deadlines" element={<MemberDeadlines />} />
          <Route path="performance" element={<MemberPerformance />} />
          <Route path="documents" element={<MemberDocs />} />
          <Route path="gantt" element={<MemberGantt />} />
          <Route path="chat" element={<TeamChat />} />
          <Route path="transition" element={<MemberTransition />} />
          <Route path="ai-assistant" element={<AiAssistant />} />
          <Route path="dev-tools" element={<DevTools />} />
          <Route path="whiteboard" element={<Whiteboard />} />
        </Route>
        {/* Member Dashboard Route */}
        <Route
          path="/member/dashboard"
          element={
            <RoleRoute allowedRoles={["member"]}>
              <MemberDashboard />
            </RoleRoute>
          }
        />

        {/* Legacy Member Dashboard Route (redirect) */}
        <Route
          path="/member-dashboard"
          element={<Navigate to="/member/dashboard" replace />}
        />

        {/* Legacy Auth routes removed - UnifiedAuth is now used */}

        {/* Role-based routes */}
        <Route
          path="/dashboard"
          element={
            <RoleRoute allowedRoles={["owner", "admin", "leader"]}>
              <Dashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/workspace"
          element={
            <RoleRoute allowedRoles={["team", "member"]}>
              <Workspace />
            </RoleRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <RoleRoute allowedRoles={["owner", "admin", "team", "leader", "member"]}>
              <Tasks />
            </RoleRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <RoleRoute allowedRoles={["owner", "admin", "team", "leader", "member"]}>
              <Projects />
            </RoleRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <RoleRoute allowedRoles={["owner", "admin", "team", "leader", "member"]}>
              <ProjectDetail />
            </RoleRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <RoleRoute allowedRoles={["leader", "member"]}>
              <Profile />
            </RoleRoute>
          }
        />

        <Route path="/relax" element={<RelaxGame />} />

        {/* Fallback route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">404 - Page Not Found</h1>
                <p className="text-gray-300 mb-6">The page you're looking for doesn't exist.</p>
                <a
                  href="/"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Go Home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}


export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <TasksProvider>
            <BugsProvider>
              <PageLoaderWithCube>
                <div className="flex flex-col min-h-screen">
                  <div className="flex-1">
                    <AppRoutes />
                  </div>
                  {/* Global Credits Footer */}
                  <footer className="py-4 border-t border-white/5 bg-[#0B0F14]/80 backdrop-blur-sm text-center relative z-50">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.4em]">
                      © 2026 TASKHIVE — DEVELOPED BY MADHAV & MANASWINI
                    </p>
                  </footer>
                </div>
                <ThemeToggle />
                <GlobalGlow />
                <NotificationBanner />
              </PageLoaderWithCube>
            </BugsProvider>
          </TasksProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
