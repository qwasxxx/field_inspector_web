import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import { PublicRoute } from '@/app/router/PublicRoute';
import { ObjectsPage } from '@/features/objects/ObjectsPage';
import { ChecklistBuilderPage } from '@/pages/ChecklistBuilderPage/ChecklistBuilderPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { PlanningPage } from '@/pages/PlanningPage/PlanningPage';
import { LoginPage } from '@/pages/Login/LoginPage';
import { RouteExecutionPage } from '@/pages/RouteExecution/RouteExecutionPage';
import { TaskChatsPage } from '@/pages/TaskChatsPage/TaskChatsPage';
import { TaskRequestsPage } from '@/pages/TaskRequestsPage/TaskRequestsPage';
import { TaskCreatePage } from '@/pages/TasksPage/TaskCreatePage';
import { TaskDetailPage } from '@/pages/TasksPage/TaskDetailPage';
import { TasksListPage } from '@/pages/TasksPage/TasksListPage';
import { WorkersPage } from '@/pages/WorkersPage/WorkersPage';
import { TopologyPage } from '@/pages/TopologyPage/TopologyPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage/AnalyticsPage';
import { DefectsPage } from '@/pages/DefectsPage/DefectsPage';
import { RedAlertsPage } from '@/pages/RedAlertsPage/RedAlertsPage';
import { ReportDetailPage } from '@/pages/ReportsPage/ReportDetailPage';
import { ReportsListPage } from '@/pages/ReportsPage/ReportsListPage';
import { Integration1CPage } from '@/pages/Integration1CPage/Integration1CPage';
import { MainLayout } from '@/widgets/MainLayout/MainLayout';

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="workers" element={<WorkersPage />} />
        <Route path="objects" element={<ObjectsPage />} />
        <Route path="topology" element={<TopologyPage />} />
        <Route path="tasks/create" element={<TaskCreatePage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route path="tasks" element={<TasksListPage />} />
        <Route path="task-requests" element={<TaskRequestsPage />} />
        <Route path="chats" element={<TaskChatsPage />} />
        <Route path="planning" element={<PlanningPage />} />
        <Route path="checklist-builder" element={<ChecklistBuilderPage />} />
        <Route path="red-alerts" element={<RedAlertsPage />} />
        <Route path="defects" element={<DefectsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="reports/:id" element={<ReportDetailPage />} />
        <Route path="reports" element={<ReportsListPage />} />
        <Route path="integration-1c" element={<Integration1CPage />} />
        <Route path="route/:id" element={<RouteExecutionPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
