import React, { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import  LoadingScreen from "@/components/ui/LoadingScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Eagerly loaded pages (critical for initial load)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from '@/pages/AuthCallback';
import WhyUsPage from "./pages/WhyUsPage";

// Lazy loaded pages (split into separate bundles)
const StudyNowPage = lazy(() => import("./pages/StudyNowPage"));
const TestPage = lazy(() => import("./pages/TestPage"));
const TestAttemptPage = lazy(() => import("./pages/TestAttemptPage"));
const TestResultsPage = lazy(() => import("./pages/TestResultsPage"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const GoalSelectionClean = lazy(() => import('@/pages/GoalSelectionClean'));
const StudyHub = lazy(() => import('@/pages/StudyHub'));
const AIStudyPlannerPage = lazy(() => import('./pages/AIStudyPlannerPage'));
const EnhancedDashboard = lazy(() => import("./pages/EnhancedDashboard"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const SubscriptionPlans = lazy(() => import('@/pages/SubscriptionPlans'));
const PricingPage = lazy(() => import('@/components/Pricing'));


// Components
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Dashboard Router Component
const DashboardRouter = () => {
  const { userRole, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && userRole === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [userRole, isLoading, navigate]);

  if (isLoading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return <EnhancedDashboard />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <Toaster />
              <Sonner />
              <Suspense>
                <Routes>
                {/* Public Route*/}
                  <Route path="/" element={<Index />} />
                  <Route path="/why-us" element={<WhyUsPage />} />
                  
                  {/* Authentication Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  {/* Goal Selection */}
                  <Route path="/goal-selection" element={<GoalSelectionClean />} />
                  
                  {/* Study Hub */}
                  <Route
                    path="/study-hub"
                    element={
                      <ProtectedRoute>
                        <StudyHub />
                      </ProtectedRoute>
                    }
                  />
                
                {/* Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardRouter />
                    </ProtectedRoute>
                  }
                />
                
                {/* Test Routes */}
                <Route path="/test-attempt/:testId" element={<TestAttemptPage />} />
                <Route path="/test-attempt" element={<TestAttemptPage />} />
                <Route path="/test-results" element={<TestResultsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/subscription-plans" element={<SubscriptionPlans />} />

              
                {/* AI Study Planner */}
                <Route
                  path="/ai-planner"
                  element={
                    <ProtectedRoute>
                      <AIStudyPlannerPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Study Routes */}
                <Route
                  path="/study-now"
                  element={
                    <ProtectedRoute>
                      <StudyNowPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Test Management */}
                <Route
                  path="/tests"
                  element={
                    <ProtectedRoute>
                      <TestPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Profile */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                
                {/* Settings */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                
                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/content"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/topics"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/exam-config"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/questions"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/notifications"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/pdf-extract"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/review-queue"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/auto-assign"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                
                {/* 404 - Not Found */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
