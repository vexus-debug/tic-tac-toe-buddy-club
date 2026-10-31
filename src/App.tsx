import { Toaster } from "@/components/ui/toaster";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { PushPermissionGate } from "@/components/PushPermissionGate";
import { OrgProvider } from "@/hooks/useOrg";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SelectClinic from "./pages/SelectClinic";
import NotFound from "./pages/NotFound";
import SiteIndex from "./site/pages/Index";
import SiteUpdates from "./site/pages/Updates";
import SiteIndustries from "./site/pages/Industries";
import SiteEyeClinics from "./site/pages/EyeClinics";
import SiteEyeClinicFeatures from "./site/pages/EyeClinicFeatures";
import SiteDentalClinics from "./site/pages/DentalClinics";
import SiteDentalPricing from "./site/pages/DentalPricing";
import SiteDentalCases from "./site/pages/DentalCasesExplained";
import SiteDentalClinicFeatures from "./site/pages/DentalClinicFeatures";
import SiteAbout from "./site/pages/About";
import SiteContact from "./site/pages/Contact";
import SitePrivacy from "./site/pages/Privacy";
import SiteTerms from "./site/pages/Terms";
import SiteCookies from "./site/pages/Cookies";
import SiteTutorials from "./site/pages/Tutorials";
import SiteTutorialClinicType from "./site/pages/TutorialClinicType";
import SiteTutorialSection from "./site/pages/TutorialSection";
import SiteTutorialDetail from "./site/pages/TutorialDetail";
import SiteArticles from "./site/pages/Articles";
import SiteArticleDetail from "./site/pages/ArticleDetail";
import SiteScrollToTop from "./site/components/ScrollToTop";

// Dashboard pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import PatientsPage from "./pages/dashboard/PatientsPage";
import AppointmentsPage from "./pages/dashboard/AppointmentsPage";
import DentalChartsPage from "./pages/dashboard/DentalChartsPage";
import TreatmentsPage from "./pages/dashboard/TreatmentsPage";
import PrescriptionsPage from "./pages/dashboard/PrescriptionsPage";
import BillingPage from "./pages/dashboard/BillingPage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import RevenueAllocationPage from "./pages/dashboard/RevenueAllocationPage";
import LabWorkPage from "./pages/dashboard/LabWorkPage";
import StaffPage from "./pages/dashboard/StaffPage";
import InventoryPage from "./pages/dashboard/InventoryPage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import SubscriptionPage from "./pages/dashboard/SubscriptionPage";
import MyProfilePage from "./pages/dashboard/MyProfilePage";
import TutorialsPage from "./pages/dashboard/TutorialsPage";
import MessagesPage from "./pages/dashboard/MessagesPage";
import ReviewsPage from "./pages/dashboard/ReviewsPage";
import ExpensesPage from "./pages/dashboard/ExpensesPage";
import PaymentPlansPage from "./pages/dashboard/PaymentPlansPage";
import EstimatesPage from "./pages/dashboard/EstimatesPage";
import CommissionPayoutsPage from "./pages/dashboard/CommissionPayoutsPage";
import MyEarningsPage from "./pages/dashboard/MyEarningsPage";
import ProfitabilityPage from "./pages/dashboard/ProfitabilityPage";
import InventoryCostsPage from "./pages/dashboard/InventoryCostsPage";
import AuditLogPage from "./pages/dashboard/AuditLogPage";
import ConsentFormsPage from "./pages/dashboard/ConsentFormsPage";
import DocumentsPage from "./pages/dashboard/DocumentsPage";
import AutomationPage from "./pages/dashboard/AutomationPage";
import WebsiteSettingsPage from "./pages/dashboard/WebsiteSettingsPage";
import PatientProfilePage from "./pages/dashboard/PatientProfilePage";
import LabDashboardPage from "./pages/dashboard/LabDashboardPage";
import LabCasesPage from "./pages/dashboard/LabCasesPage";
import LabTechniciansPage from "./pages/dashboard/LabTechniciansPage";
import LabBillingPage from "./pages/dashboard/LabBillingPage";
import LabSettingsPage from "./pages/dashboard/LabSettingsPage";
import PublicClinicSite from "./pages/PublicClinicSite";
import PublicShopPage from "./pages/PublicShopPage";
import PublicProductPage from "./pages/PublicProductPage";
import WaitingListPage from "./pages/dashboard/WaitingListPage";
import SchedulesPage from "./pages/dashboard/SchedulesPage";
import SuppliersPage from "./pages/dashboard/SuppliersPage";
import PurchaseOrdersPage from "./pages/dashboard/PurchaseOrdersPage";
import TreatmentMaterialsPage from "./pages/dashboard/TreatmentMaterialsPage";
import AdvancedAnalyticsPage from "./pages/dashboard/AdvancedAnalyticsPage";
import ShopManagementPage from "./pages/dashboard/ShopManagementPage";
import BranchesPage from "./pages/dashboard/BranchesPage";
import { MainClinicOnly } from "@/components/dashboard/MainClinicOnly";

// Dental lab
import LabRegisterPage from "./pages/dashboard/dlab/LabRegisterPage";
import DlabQcPage from "./pages/dashboard/dlab/DlabQcPage";
import DlabBenchPage from "./pages/dashboard/dlab/DlabBenchPage";
import DlabWarrantiesPage from "./pages/dashboard/dlab/DlabWarrantiesPage";
import DlabCasesPage from "./pages/dashboard/dlab/DlabCasesPage";
import DlabCalendarPage from "./pages/dashboard/dlab/DlabCalendarPage";
import DlabClientsPage from "./pages/dashboard/dlab/DlabClientsPage";
import DlabInvoicesPage from "./pages/dashboard/dlab/DlabInvoicesPage";
import DlabStatementsPage from "./pages/dashboard/dlab/DlabStatementsPage";
import DlabBillingPage from "./pages/dashboard/dlab/DlabBillingPage";
import DlabCataloguePage from "./pages/dashboard/dlab/DlabCataloguePage";
import DlabStorePage from "./pages/dashboard/dlab/DlabStorePage";
import DlabCamPage from "./pages/dashboard/dlab/DlabCamPage";
import DlabReportsPage from "./pages/dashboard/dlab/DlabReportsPage";
// Diagnostic centre — laboratory
import LabOverviewPage from "./pages/dashboard/lab/LabOverviewPage";
import TestFormsPage from "./pages/dashboard/lab/TestFormsPage";
import NewTestFormPage from "./pages/dashboard/lab/NewTestFormPage";
import ResultEntryPage from "./pages/dashboard/lab/ResultEntryPage";
import ResultsSearchPage from "./pages/dashboard/lab/ResultsSearchPage";
import ManageTestsPage from "./pages/dashboard/lab/ManageTestsPage";
import ScientistsPage from "./pages/dashboard/lab/ScientistsPage";
import LabPreferencesPage from "./pages/dashboard/lab/LabPreferencesPage";

// Diagnostic centre — imaging
import ImagingOverviewPage from "./pages/dashboard/imaging/ImagingOverviewPage";
import ScanPatientsPage from "./pages/dashboard/imaging/ScanPatientsPage";
import ScansPage from "./pages/dashboard/imaging/ScansPage";
import RegisterScanPage from "./pages/dashboard/imaging/RegisterScanPage";
import ScanAppointmentsPage from "./pages/dashboard/imaging/ScanAppointmentsPage";
import ScanActivityPage from "./pages/dashboard/imaging/ScanActivityPage";

// Diagnostic centre — pharmacy
import DrugStockPage from "./pages/dashboard/pharmacy/DrugStockPage";
import DispensingPage from "./pages/dashboard/pharmacy/DispensingPage";

// Eye clinic
import EyeOverviewPage from "./pages/dashboard/eye/EyeOverviewPage";
import EyeExamsPage from "./pages/dashboard/eye/EyeExamsPage";
import OpticalPrescriptionsPage from "./pages/dashboard/eye/OpticalPrescriptionsPage";
import ContactLensPage from "./pages/dashboard/eye/ContactLensPage";
import OpticalOrdersPage from "./pages/dashboard/eye/OpticalOrdersPage";
import EyeDiagnosticsPage from "./pages/dashboard/eye/EyeDiagnosticsPage";
import SurgeryBookingsPage from "./pages/dashboard/eye/SurgeryBookingsPage";
import EyeReportsPage from "./pages/dashboard/eye/EyeReportsPage";
import EyeChartsPage from "./pages/dashboard/eye/EyeChartsPage";
import PatientFlowPage from "./pages/dashboard/eye/PatientFlowPage";
import DoctorVisitPage from "./pages/dashboard/eye/DoctorVisitPage";
import EyeRecordsPage from "./pages/dashboard/eye/EyeRecordsPage";
import GlassesPickupPage from "./pages/dashboard/eye/GlassesPickupPage";
import FrameLensStockPage from "./pages/dashboard/eye/FrameLensStockPage";
import ReferralsPage from "./pages/dashboard/eye/ReferralsPage";
import SurgeryFollowupPage from "./pages/dashboard/eye/SurgeryFollowupPage";
import AllPrescriptionsPage from "./pages/dashboard/eye/AllPrescriptionsPage";

// Public result lookup
import PublicResultPage from "./pages/PublicResultPage";

// Admin pages
import AdminOverview from "./pages/admin/AdminOverview";
import AdminClinics from "./pages/admin/AdminClinics";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import PlatformAuditLogPage from "./pages/admin/PlatformAuditLogPage";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminClinicDetail from "./pages/admin/AdminClinicDetail";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminSupportTickets from "./pages/admin/AdminSupportTickets";
import AdminFeatureFlags from "./pages/admin/AdminFeatureFlags";
import AdminPlatformSettings from "./pages/admin/AdminPlatformSettings";
import AdminDataExport from "./pages/admin/AdminDataExport";
import AdminOnboardingFunnel from "./pages/admin/AdminOnboardingFunnel";
import AdminStorageMonitoring from "./pages/admin/AdminStorageMonitoring";
import AdminNotificationLogs from "./pages/admin/AdminNotificationLogs";
import AdminPushNotifications from "./pages/admin/AdminPushNotifications";
import AdminOutreach from "./pages/admin/AdminOutreach";
import InboxMessagePage from "./pages/InboxMessagePage";
import AdminHealthMonitoring from "./pages/admin/AdminHealthMonitoring";
import AdminWhiteLabel from "./pages/admin/AdminWhiteLabel";
import AdminLiveSessions from "./pages/admin/AdminLiveSessions";
import AdminArticles from "./pages/admin/AdminArticles";
import AdminVisitors from "./pages/admin/AdminVisitors";
import { VisitorTracker } from "@/site/visitorTracker";
import { SessionTracker } from "@/hooks/useSessionTracker";
import { PwaRouteGate } from "@/components/PwaRouteGate";
import { Seo } from "@/components/Seo";
import { AppearanceProvider } from "@/hooks/useAppearance";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep previously-loaded page data warm so revisiting a page is instant
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

function ClinicLayout() {
  return (
    <ProtectedRoute>
      <OrgProvider>
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      </OrgProvider>
    </ProtectedRoute>
  );
}


function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedAdminRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedAdminRoute>
  );
}

/** Sends pre-/app URLs (e.g. /clinic/xyz/patients) to their /app equivalent. */
function LegacyAppRedirect() {
  const location = useLocation();
  return <Navigate to={`/app${location.pathname}${location.search}${location.hash}`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppearanceProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Seo />
          <PwaRouteGate />
          <InstallPrompt />
          <SessionTracker />
          <VisitorTracker />
          <SiteScrollToTop />
          <Routes>
            {/* Public marketing site */}
            <Route path="/" element={<SiteIndex />} />
            <Route path="/features" element={<Navigate to="/industries/eye-clinics/features" replace />} />
            <Route path="/industries" element={<SiteIndustries />} />
            <Route path="/industries/eye-clinics" element={<SiteEyeClinics />} />
            <Route path="/industries/eye-clinics/features" element={<SiteEyeClinicFeatures />} />
            <Route path="/industries/dental-clinics" element={<SiteDentalClinics />} />
            <Route path="/industries/dental-clinics/pricing" element={<SiteDentalPricing />} />
            <Route path="/industries/dental-clinics/how-cases-work" element={<SiteDentalCases />} />
            <Route path="/industries/dental-clinics/features" element={<SiteDentalClinicFeatures />} />
            <Route path="/about" element={<SiteAbout />} />
            <Route path="/updates" element={<SiteUpdates />} />
            <Route path="/contact" element={<SiteContact />} />
            <Route path="/privacy" element={<SitePrivacy />} />
            <Route path="/terms" element={<SiteTerms />} />
            <Route path="/cookies" element={<SiteCookies />} />
            <Route path="/tutorials" element={<SiteTutorials />} />
            <Route path="/articles" element={<SiteArticles />} />
            <Route path="/articles/category/:category" element={<SiteArticles />} />
            <Route path="/articles/:slug" element={<SiteArticleDetail />} />
            <Route path="/tutorials/:clinicType" element={<SiteTutorialClinicType />} />
            <Route path="/tutorials/:clinicType/:section" element={<SiteTutorialSection />} />
            <Route path="/tutorials/:clinicType/:section/:tutorial" element={<SiteTutorialDetail />} />
            <Route path="/demo" element={<Navigate to="/app/signup" replace />} />

            <Route path="/site/:slug" element={<PublicClinicSite />} />
            <Route path="/site/:slug/shop" element={<PublicShopPage />} />
            <Route path="/site/:slug/shop/:productId" element={<PublicProductPage />} />
            <Route path="/result" element={<PublicResultPage />} />

            {/* Legacy app URLs — bounce into the /app area */}
            <Route path="/login" element={<Navigate to="/app/login" replace />} />
            <Route path="/signup" element={<Navigate to="/app/signup" replace />} />
            <Route path="/select-clinic" element={<Navigate to="/app/select-clinic" replace />} />
            <Route path="/dashboard" element={<Navigate to="/app/select-clinic" replace />} />
            <Route path="/dashboard/*" element={<Navigate to="/app/select-clinic" replace />} />
            <Route path="/admin/*" element={<LegacyAppRedirect />} />
            <Route path="/clinic/*" element={<LegacyAppRedirect />} />

            {/* Installed-app area: everything under /app stays inside the PWA.
                Public site links live outside this prefix, so they always open
                in the normal browser instead of the installed app. */}
            <Route path="/app" element={<PushPermissionGate />}>
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="select-clinic" element={<SelectClinic />} />

              {/* Admin routes */}
              <Route path="admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
              <Route path="admin/clinics" element={<AdminRoute><AdminClinics /></AdminRoute>} />
              <Route path="admin/clinics/:slug" element={<AdminRoute><AdminClinicDetail /></AdminRoute>} />
              <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="admin/subscriptions" element={<AdminRoute><AdminSubscriptions /></AdminRoute>} />
              <Route path="admin/revenue" element={<AdminRoute><AdminRevenue /></AdminRoute>} />
              <Route path="admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="admin/visitors" element={<AdminRoute><AdminVisitors /></AdminRoute>} />
              <Route path="admin/onboarding" element={<AdminRoute><AdminOnboardingFunnel /></AdminRoute>} />
              <Route path="admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
              <Route path="admin/support" element={<AdminRoute><AdminSupportTickets /></AdminRoute>} />
              <Route path="inbox" element={<InboxMessagePage />} />
              <Route path="inbox/:id" element={<InboxMessagePage />} />
              <Route path="admin/push" element={<AdminRoute><AdminPushNotifications /></AdminRoute>} />
              <Route path="admin/outreach" element={<AdminRoute><AdminOutreach /></AdminRoute>} />
              <Route path="admin/articles" element={<AdminRoute><AdminArticles /></AdminRoute>} />
              <Route path="admin/notification-logs" element={<AdminRoute><AdminNotificationLogs /></AdminRoute>} />
              <Route path="admin/feature-flags" element={<AdminRoute><AdminFeatureFlags /></AdminRoute>} />
              <Route path="admin/settings" element={<AdminRoute><AdminPlatformSettings /></AdminRoute>} />
              <Route path="admin/audit-log" element={<AdminRoute><PlatformAuditLogPage /></AdminRoute>} />
              <Route path="admin/sessions" element={<AdminRoute><AdminLiveSessions /></AdminRoute>} />
              <Route path="admin/health" element={<AdminRoute><AdminHealthMonitoring /></AdminRoute>} />
              <Route path="admin/storage" element={<AdminRoute><AdminStorageMonitoring /></AdminRoute>} />
              <Route path="admin/data-export" element={<AdminRoute><AdminDataExport /></AdminRoute>} />
              <Route path="admin/white-label" element={<AdminRoute><AdminWhiteLabel /></AdminRoute>} />

              {/* Clinic routes */}
              <Route path="clinic/:slug" element={<ClinicLayout />}>
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="patients/:id" element={<PatientProfilePage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="dental-charts" element={<DentalChartsPage />} />
              <Route path="treatments" element={<TreatmentsPage />} />
              <Route path="prescriptions" element={<PrescriptionsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="revenue-allocation" element={<RevenueAllocationPage />} />
              <Route path="lab-work" element={<LabWorkPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<MyProfilePage />} />
              <Route path="tutorials" element={<TutorialsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="payment-plans" element={<PaymentPlansPage />} />
              <Route path="estimates" element={<EstimatesPage />} />
              <Route path="commissions" element={<CommissionPayoutsPage />} />
              <Route path="my-earnings" element={<MyEarningsPage />} />
              <Route path="profitability" element={<ProfitabilityPage />} />
              <Route path="inventory-costs" element={<InventoryCostsPage />} />
              <Route path="audit-log" element={<AuditLogPage />} />
              <Route path="consent-forms" element={<ConsentFormsPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="automation" element={<AutomationPage />} />
              <Route path="website-settings" element={<MainClinicOnly><WebsiteSettingsPage /></MainClinicOnly>} />
              <Route path="branches" element={<BranchesPage />} />
              <Route path="waiting-list" element={<WaitingListPage />} />
              <Route path="schedules" element={<SchedulesPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="treatment-materials" element={<TreatmentMaterialsPage />} />
              <Route path="analytics" element={<AdvancedAnalyticsPage />} />
              <Route path="shop-management" element={<MainClinicOnly><ShopManagementPage /></MainClinicOnly>} />
              <Route path="marketing/*" element={<Navigate to="../dashboard" replace />} />
              <Route path="lab" element={<LabDashboardPage />} />
              <Route path="lab/cases" element={<LabCasesPage />} />
              <Route path="lab/technicians" element={<LabTechniciansPage />} />
              <Route path="lab/billing" element={<LabBillingPage />} />
              <Route path="lab/settings" element={<LabSettingsPage />} />

              {/* Dental lab */}
              <Route path="dlab" element={<Navigate to="../dashboard" replace />} />
              <Route path="dlab/cases" element={<DlabCasesPage />} />
              <Route path="dlab/calendar" element={<DlabCalendarPage />} />
              <Route path="dlab/bench" element={<DlabBenchPage />} />
              <Route path="dlab/clients" element={<DlabClientsPage />} />
              <Route path="dlab/invoices" element={<Navigate to="../dlab/billing" replace />} />
              <Route path="dlab/statements" element={<Navigate to="../dlab/clients" replace />} />
              <Route path="dlab/billing" element={<DlabBillingPage />} />
              <Route path="dlab/catalogue" element={<DlabCataloguePage />} />
              <Route path="dlab/store" element={<DlabStorePage />} />
              <Route path="dlab/cam" element={<DlabCamPage />} />
              <Route path="dlab/reports" element={<DlabReportsPage />} />
              <Route path="dlab/r/qc" element={<DlabQcPage />} />
              <Route path="dlab/r/warranties" element={<DlabWarrantiesPage />} />
              <Route path="dlab/r/:kind" element={<LabRegisterPage />} />

              {/* Diagnostic centre — laboratory */}
              <Route path="diagnostics" element={<LabOverviewPage />} />
              <Route path="diagnostics/forms" element={<TestFormsPage />} />
              <Route path="diagnostics/forms/new" element={<NewTestFormPage />} />
              <Route path="diagnostics/forms/:serial" element={<ResultEntryPage />} />
              <Route path="diagnostics/results" element={<ResultsSearchPage />} />
              <Route path="diagnostics/tests" element={<ManageTestsPage />} />
              <Route path="diagnostics/scientists" element={<ScientistsPage />} />
              <Route path="diagnostics/settings" element={<LabPreferencesPage />} />

              {/* Diagnostic centre — imaging */}
              <Route path="imaging" element={<ImagingOverviewPage />} />
              <Route path="imaging/patients" element={<ScanPatientsPage />} />
              <Route path="imaging/scans" element={<ScansPage />} />
              <Route path="imaging/register" element={<RegisterScanPage />} />
              <Route path="imaging/appointments" element={<ScanAppointmentsPage />} />
              <Route path="imaging/activity" element={<ScanActivityPage />} />

              {/* Diagnostic centre — pharmacy */}
              <Route path="pharmacy/drugs" element={<DrugStockPage />} />
              <Route path="pharmacy/dispensing" element={<DispensingPage />} />

              {/* Eye clinic */}
              <Route path="eye" element={<EyeOverviewPage />} />
              <Route path="eye/exams" element={<EyeExamsPage />} />
              <Route path="eye/prescriptions" element={<AllPrescriptionsPage />} />
              <Route path="eye/glasses-prescriptions" element={<OpticalPrescriptionsPage />} />
              <Route path="eye/flow" element={<PatientFlowPage />} />
              <Route path="eye/visit" element={<DoctorVisitPage />} />
              <Route path="eye/records" element={<EyeRecordsPage />} />
              <Route path="eye/pickup" element={<GlassesPickupPage />} />
              <Route path="eye/stock" element={<FrameLensStockPage />} />
              <Route path="eye/referrals" element={<ReferralsPage />} />
              <Route path="eye/surgery-checklists" element={<SurgeryFollowupPage />} />
              <Route path="eye/contact-lenses" element={<ContactLensPage />} />
              <Route path="eye/orders" element={<OpticalOrdersPage />} />
              <Route path="eye/diagnostics" element={<EyeDiagnosticsPage />} />
              <Route path="eye/reports" element={<EyeReportsPage />} />
              <Route path="eye/charts" element={<EyeChartsPage />} />
              <Route path="eye/surgery" element={<SurgeryBookingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </AppearanceProvider>
  </QueryClientProvider>
);

export default App;
