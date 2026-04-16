import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ReportsPage() {
  return (
    <AppShell
      title="Отчёты"
      subtitle="Экспорт и аналитика появятся на следующем этапе"
    >
      <EmptyState
        title="Раздел в разработке"
        description="Здесь будут доступны выгрузки по периодам, сводные таблицы и печатные формы для руководства. Сейчас используются только демонстрационные данные в других разделах."
      />
    </AppShell>
  );
}
