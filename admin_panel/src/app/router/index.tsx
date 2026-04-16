import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import { PublicRoute } from '@/app/router/PublicRoute';
import { PlaceholderPage } from '@/pages/Common/PlaceholderPage';
import { ChecklistBuilderPage } from '@/pages/ChecklistBuilderPage/ChecklistBuilderPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { PlanningPage } from '@/pages/PlanningPage/PlanningPage';
import { LoginPage } from '@/pages/Login/LoginPage';
import { RouteExecutionPage } from '@/pages/RouteExecution/RouteExecutionPage';
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
        <Route path="employees" element={<PlaceholderPage title="Сотрудники" />} />
        <Route path="objects" element={<PlaceholderPage title="Объекты" />} />
        <Route path="tasks" element={<PlaceholderPage title="Задания" />} />
        <Route path="planning" element={<PlanningPage />} />
        <Route path="checklist-builder" element={<ChecklistBuilderPage />} />
        <Route path="defects" element={<PlaceholderPage title="Дефекты" />} />
        <Route path="analytics" element={<PlaceholderPage title="Аналитика" />} />
        <Route path="reports" element={<PlaceholderPage title="Отчёты" />} />
        <Route path="settings" element={<PlaceholderPage title="Настройки" />} />
        <Route path="route/:id" element={<RouteExecutionPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
