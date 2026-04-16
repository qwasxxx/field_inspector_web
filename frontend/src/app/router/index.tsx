import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import { PublicRoute } from '@/app/router/PublicRoute';
import { PlaceholderPage } from '@/pages/Common/PlaceholderPage';
import { SettingsPage } from '@/pages/SettingsPage/SettingsPage';
import { ChecklistBuilderPage } from '@/pages/ChecklistBuilderPage/ChecklistBuilderPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { PlanningPage } from '@/pages/PlanningPage/PlanningPage';
import { LoginPage } from '@/pages/Login/LoginPage';
import { RouteExecutionPage } from '@/pages/RouteExecution/RouteExecutionPage';
import { TaskRequestsPage } from '@/pages/TaskRequestsPage/TaskRequestsPage';
import { TaskCreatePage } from '@/pages/TasksPage/TaskCreatePage';
import { TaskDetailPage } from '@/pages/TasksPage/TaskDetailPage';
import { TasksListPage } from '@/pages/TasksPage/TasksListPage';
import { WorkersPage } from '@/pages/WorkersPage/WorkersPage';
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
        <Route path="employees" element={<PlaceholderPage title="Сотрудники" />} />
        <Route path="objects" element={<PlaceholderPage title="Объекты" />} />
        <Route path="tasks/create" element={<TaskCreatePage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route path="tasks" element={<TasksListPage />} />
        <Route path="task-requests" element={<TaskRequestsPage />} />
        <Route path="planning" element={<PlanningPage />} />
        <Route path="checklist-builder" element={<ChecklistBuilderPage />} />
        <Route path="defects" element={<PlaceholderPage title="Дефекты" />} />
        <Route path="analytics" element={<PlaceholderPage title="Аналитика" />} />
        <Route path="reports" element={<PlaceholderPage title="Отчёты" />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="route/:id" element={<RouteExecutionPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
