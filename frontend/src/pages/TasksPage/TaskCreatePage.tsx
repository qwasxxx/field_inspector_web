import { Navigate } from 'react-router-dom';

/** Создание заданий перенесено в раздел «Объекты». */
export function TaskCreatePage() {
  return <Navigate to="/objects" replace />;
}
