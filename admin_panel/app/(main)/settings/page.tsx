import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";

export default function SettingsPage() {
  return (
    <AppShell
      title="Настройки"
      subtitle="Параметры доступа и интеграций — позже"
    >
      <EmptyState
        title="Настройки пока недоступны"
        description="В этой версии панели нет сохранения конфигурации. После подключения API здесь появятся учётные записи, роли и параметры уведомлений."
      />
    </AppShell>
  );
}
