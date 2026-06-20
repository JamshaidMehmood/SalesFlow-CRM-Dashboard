import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { GoogleAuthProvider } from './context/GoogleAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute, { PublicRoute, AdminRoute } from './routes/ProtectedRoute';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ContactsPage from './pages/Contacts/ContactsPage';
import ContactDetailPage from './pages/ContactDetail/ContactDetailPage';
import PipelinePage from './pages/Pipeline/PipelinePage';
import ActivitiesPage from './pages/Activities/ActivitiesPage';
import SettingsPage from './pages/Settings/SettingsPage';
import PipelineSettingsPage from './pages/Settings/PipelineSettingsPage';
import QuotasPage from './pages/Settings/QuotasPage';
import CustomFieldsPage from './pages/Settings/CustomFieldsPage';
import LeadSourcesPage from './pages/Settings/LeadSourcesPage';
import AuditLogPage from './pages/Settings/AuditLogPage';
import TeamsPage from './pages/Settings/TeamsPage';
import TerritoriesPage from './pages/Settings/TerritoriesPage';
import DuplicatesPage from './pages/Settings/DuplicatesPage';
import LeaderboardPage from './pages/Leaderboard/LeaderboardPage';
import ReportsPage from './pages/Reports/ReportsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="contacts/duplicates" element={<DuplicatesPage />} />
            <Route path="contacts/:id" element={<ContactDetailPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route element={<AdminRoute />}>
              <Route path="settings/pipeline" element={<PipelineSettingsPage />} />
              <Route path="settings/quotas" element={<QuotasPage />} />
              <Route path="settings/custom-fields" element={<CustomFieldsPage />} />
              <Route path="settings/lead-sources" element={<LeadSourcesPage />} />
              <Route path="settings/audit-log" element={<AuditLogPage />} />
              <Route path="settings/teams" element={<TeamsPage />} />
              <Route path="settings/territories" element={<TerritoriesPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <GoogleAuthProvider>
            <AppRoutes />
          </GoogleAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
