import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import { MaintenanceGuard } from './components/MaintenanceGuard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Keep Home static for fast initial load
import Home from './pages/Home';

// Lazy load other public pages
const Auth = lazy(() => import('./pages/Auth'));
const HostAuth = lazy(() => import('./pages/HostAuth'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const ListProperty = lazy(() => import('./pages/ListProperty'));
const Listings = lazy(() => import('./pages/Listings'));
const Support = lazy(() => import('./pages/Support'));
const Profile = lazy(() => import('./pages/Profile'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const HelpArticles = lazy(() => import('./pages/HelpArticles'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const ReportConcern = lazy(() => import('./pages/ReportConcern'));
const HostingRules = lazy(() => import('./pages/HostingRules'));
const LearnToHost = lazy(() => import('./pages/LearnToHost'));
const CompanyDetails = lazy(() => import('./pages/CompanyDetails'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const PaymentPolicy = lazy(() => import('./pages/PaymentPolicy'));
const AboutUs = lazy(() => import('./pages/AboutUs'));

// Lazy load Admin Components (Named Exports)
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminPendingApprovals = lazy(() => import('./pages/admin/AdminPendingApprovals').then(m => ({ default: m.AdminPendingApprovals })));
const AdminWallet = lazy(() => import('./pages/admin/AdminWallet').then(m => ({ default: m.AdminWallet })));
const AdminRecentRegistrations = lazy(() => import('./pages/admin/AdminRecentRegistrations').then(m => ({ default: m.AdminRecentRegistrations })));
const AdminManageProperties = lazy(() => import('./pages/admin/AdminManageProperties').then(m => ({ default: m.AdminManageProperties })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminOwnerDetails = lazy(() => import('./pages/admin/AdminOwnerDetails').then(m => ({ default: m.AdminOwnerDetails })));
const AdminFeedback = lazy(() => import('./pages/admin/AdminFeedback').then(m => ({ default: m.AdminFeedback })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-background/50 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-bold text-on-surface-variant animate-pulse tracking-widest uppercase">Loading...</p>
    </div>
  </div>
);

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin-secret-dashboard');

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-on-surface">
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow pt-16 md:pt-20">
        <MaintenanceGuard>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/host-auth" element={<HostAuth />} />
              <Route path="/property/:id" element={<PropertyDetail />} />
              <Route path="/list-property" element={<ListProperty />} />
              <Route path="/stays" element={<Listings />} />
              <Route path="/support" element={<Support />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/book/:propertyId" element={<BookingPage />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/help-articles" element={<HelpArticles />} />
              <Route path="/help-articles/:id" element={<ArticleDetail />} />
              <Route path="/report-concern" element={<ReportConcern />} />
              <Route path="/hosting-rules" element={<HostingRules />} />
              <Route path="/learn-to-host" element={<LearnToHost />} />
              <Route path="/company-details" element={<CompanyDetails />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/payment-policy" element={<PaymentPolicy />} />
              <Route path="/about-us" element={<AboutUs />} />
              
              {/* Admin Routes */}
              <Route path="/admin-secret-dashboard" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="pending-approvals" element={<AdminPendingApprovals />} />
                <Route path="wallet" element={<AdminWallet />} />
                <Route path="recent-registrations" element={<AdminRecentRegistrations />} />
                <Route path="manage-properties" element={<AdminManageProperties />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/owner/:id" element={<AdminOwnerDetails />} />
                <Route path="feedback" element={<AdminFeedback />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </Suspense>
        </MaintenanceGuard>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminProvider>
          <Router>
            <AppContent />
          </Router>
        </AdminProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
