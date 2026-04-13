import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MaintenanceGuard } from './components/MaintenanceGuard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Auth from './pages/Auth';
import HostAuth from './pages/HostAuth';
import PropertyDetail from './pages/PropertyDetail';
import ListProperty from './pages/ListProperty';
import Listings from './pages/Listings';
import Support from './pages/Support';
import Profile from './pages/Profile';
import BookingPage from './pages/BookingPage';
import HelpCenter from './pages/HelpCenter';
import HelpArticles from './pages/HelpArticles';
import ArticleDetail from './pages/ArticleDetail';
import ReportConcern from './pages/ReportConcern';
import HostingRules from './pages/HostingRules';
import LearnToHost from './pages/LearnToHost';
import CompanyDetails from './pages/CompanyDetails';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import RefundPolicy from './pages/RefundPolicy';
import PaymentPolicy from './pages/PaymentPolicy';
import AboutUs from './pages/AboutUs';

// Admin Components
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPendingApprovals } from './pages/admin/AdminPendingApprovals';
import { AdminWallet } from './pages/admin/AdminWallet';
import { AdminRecentRegistrations } from './pages/admin/AdminRecentRegistrations';
import { AdminManageProperties } from './pages/admin/AdminManageProperties';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminOwnerDetails } from './pages/admin/AdminOwnerDetails';
import { AdminFeedback } from './pages/admin/AdminFeedback';
import { AdminSettings } from './pages/admin/AdminSettings';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin-secret-dashboard');

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-on-surface">
      <Navbar />
      <main className="flex-grow pt-16 md:pt-20">
        <MaintenanceGuard>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/host-auth" element={<HostAuth />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/list-property" element={<ListProperty />} />
            <Route path="/listings" element={<Listings />} />
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
