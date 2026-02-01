import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { PricingPage } from '@/pages/PricingPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardRouter } from '@/pages/dashboard/DashboardRouter';
import { StartupDiscoveryPage } from '@/pages/discover/StartupDiscoveryPage';
import { TalentDiscoveryPage } from '@/pages/discover/TalentDiscoveryPage';
import { MessagesPage } from '@/pages/messaging/MessagesPage';
import { StartupProfilePage } from '@/pages/startup/StartupProfilePage';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Public Route Component - redirects to dashboard if already authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <SignupPage />
        </PublicRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicRoute>
          <ForgotPasswordPage />
        </PublicRoute>
      } />

      {/* App Routes with Layout */}
      <Route element={<AppLayout />}>
        {/* Dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        } />

        {/* Discovery */}
        <Route path="/discover/startups" element={
          <ProtectedRoute>
            <StartupDiscoveryPage />
          </ProtectedRoute>
        } />
        <Route path="/discover/talents" element={
          <ProtectedRoute>
            <TalentDiscoveryPage />
          </ProtectedRoute>
        } />

        {/* Startup Profile */}
        <Route path="/startups/:id" element={
          <ProtectedRoute>
            <StartupProfilePage />
          </ProtectedRoute>
        } />

        {/* Messages */}
        <Route path="/messages" element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        } />

        {/* Placeholder Routes - will be implemented */}
        <Route path="/startups" element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">My Startups</h1>
              <p className="text-muted-foreground">This page is coming soon.</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/team" element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Team Management</h1>
              <p className="text-muted-foreground">This page is coming soon.</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/applications" element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Applications</h1>
              <p className="text-muted-foreground">This page is coming soon.</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Analytics</h1>
              <p className="text-muted-foreground">This page is coming soon.</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/saved" element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Saved</h1>
              <p className="text-muted-foreground">This page is coming soon.</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/portfolio" element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Portfolio</h1>
              <p className="text-muted-foreground">This page is coming soon.</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/deals" element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Deals</h1>
              <p className="text-muted-foreground">This page is coming soon.</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Profile</h1>
              <p className="text-muted-foreground">This page is coming soon.</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Settings</h1>
              <p className="text-muted-foreground">This page is coming soon.</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Notifications</h1>
              <p className="text-muted-foreground">This page is coming soon.</p>
            </div>
          </ProtectedRoute>
        } />
      </Route>

      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-muted-foreground mb-6">Page not found</p>
            <a href="/" className="text-primary hover:underline">
              Go back home
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
