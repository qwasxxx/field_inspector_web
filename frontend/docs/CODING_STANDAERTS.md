# 📘 Стандарты разработки фронтенда (React + TypeScript)

Документ относится к приложению **`frontend`** (единственный фронтенд в этом репозитории).

## 📑 Содержание

* Архитектурные принципы
* Структура файлов
* Компоненты
* Хуки
* Мапперы
* Обработчики событий
* Стили
* Типы
* Конфигурация

---

# 🧠 Архитектурные принципы

## SOLID

### 1. Single Responsibility Principle (SRP)

Каждая сущность отвечает только за одну задачу:

* Компонент → только UI
* Хук → состояние и side-effects
* Маппер → преобразование данных
* Handler → обработка событий

#### ✅ Хороший пример

```tsx
const DashboardView: React.FC<DashboardViewProps> = ({ onOpenSection }) => {
  const { result, loading } = useDashboardData();

  if (loading) return <DashboardSkeleton />;

  return <CardGrid items={result} />;
};
```

#### ❌ Плохой пример

```tsx
const DashboardView: React.FC = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(res => {
        const normalized = res.list.map(el => ({
          ...el,
          label: el.title.toLowerCase(),
        }));
        setItems(normalized);
      });
  }, []);

  return <div>{/* ... */}</div>;
};
```

---

### 2. Dependency Inversion Principle (DIP)

Зависимость от абстракций, а не реализаций

#### ✅

```ts
interface UserBadgeProps {
  userData: UserDto;
  onSelectRole?: (roleId: string) => void;
}
```

#### ❌

```ts
interface UserBadgeProps {
  apiClient: HttpClient;
}
```

---

### 3. Open/Closed Principle (OCP)

Компоненты расширяемы без изменения исходного кода

#### ✅

```ts
interface NavTrailProps {
  links: NavItem[];
  onNavigate?: (item: NavItem) => void;
}
```

#### ❌

```ts
const NavTrail = () => {
  const handleClick = () => {
    window.location.href = '/dashboard';
  };
};
```

---

# 📁 Структура проекта

## 📄 Страница (Page)

```
pages/
└── Dashboard/
    ├── DashboardView.tsx
    ├── DashboardView.module.scss
    ├── DashboardView.types.ts
    ├── DashboardView.constants.ts
    ├── DashboardView.mapper.ts
    ├── DashboardView.handlers.ts
    └── components/
        ├── DashboardSkeleton.tsx
        ├── DashboardError.tsx
        ├── DashboardEmpty.tsx
        └── CardGrid/
            ├── CardGrid.tsx
            └── CardGrid.module.scss
```

---

## 🧩 Компонент

```
components/
└── UserBadge/
    ├── UserBadge.tsx
    ├── UserBadge.module.scss
    ├── UserBadge.mapper.ts
    └── index.ts
```

---

# ⚛️ Компоненты

## Стандартная структура

```tsx
import React, { useMemo, useEffect, useState } from 'react';
import type { UserDto } from '@/shared/types';
import styles from './UserCard.module.scss';

interface UserCardProps {
  user: UserDto;
  onClick?: (id: string) => void;
}

/**
 * Компонент отображения пользователя
 */
const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
  const [isActive, setIsActive] = useState(false);

  const displayName = useMemo(() => {
    return user.name.trim();
  }, [user]);

  useEffect(() => {
    // side effect
  }, []);

  const handleClick = () => {
    onClick?.(user.id);
  };

  if (!user) return null;

  return (
    <div className={styles.wrapper} onClick={handleClick}>
      {displayName}
    </div>
  );
};

export default UserCard;
```

---

## Состояния страницы

```tsx
if (loading) return <PageLoader />;

if (error) return <PageErrorView error={error} onRetry={reload} />;

if (!data) return <PageEmptyState />;

return <PageContent data={data} />;
```

---

# 🪝 Хуки

## Доменные хуки

```ts
export function useDashboardData(params?: FetchParams) {
  return useDataQuery<DataDto>(
    () => api.dashboard.fetch(params),
    [params?.filter],
    { enabled: true }
  );
}
```

---

## Базовый хук

```ts
const { data, loading, error, refetch } = useDataQuery<ResponseType>(
  () => api.getData(),
  [],
  {
    onSuccess: (data) => console.log(data),
    onError: (err) => console.error(err),
  }
);
```

---

# 🔄 Мапперы

```ts
export class UserMapper {
  static toSelectOptions(users: UserDto[]): SelectOption[] {
    return users.map(user => ({
      value: user.id,
      label: user.name,
    }));
  }

  static toDisplayName(user: UserDto): string {
    return `${user.firstName} ${user.lastName}`;
  }
}
```

### Правила:

* Только `static`
* Без side-effects
* Один маппер = одна зона ответственности

---

# 🎯 Обработчики

```ts
export class DashboardActions {
  static handleCardClick(
    card: CardItem,
    onOpen: () => void,
    onRedirect?: (url: string) => void
  ) {
    if (card.link && onRedirect) {
      onRedirect(card.link);
      return;
    }

    onOpen();
  }
}
```

---

# 🎨 Стили (SCSS Modules)

```scss
.container {
  padding: 32px;
  background: var(--app-bg-primary, #fff);
}

.containerActive {
  border-radius: 12px;
}

.title {
  font-size: 20px;
  font-weight: 600;
}
```

---

## ⚠️ Глобальная защита

```scss
a:hover:not([class*="Mui"]):not([class*="ui-"]) {
  color: var(--color-accent);
}
```

---

# 🧾 Типы

```ts
export interface DashboardViewProps {
  onOpenSection: () => void;
  onNavigate?: (path: string) => void;
}

export type NavigateFn = (path: string) => void;
```

---

# ⚙️ Конфигурация

```ts
export const ROUTE_KEYS = {
  HOME: 'home',
  SETTINGS: 'settings',
} as const;

export const ROUTE_CONFIG = {
  BASE: '/',
  buildPath: (key: keyof typeof ROUTE_KEYS) => `/${key}`,
} as const;
```

---

# ✅ Чеклист перед коммитом

* [ ] Нет ошибок TypeScript
* [ ] Компонент соблюдает SRP
* [ ] Логика вынесена в mapper / handler
* [ ] Типы описаны
* [ ] Обработаны состояния (loading / error / empty)
* [ ] Используются SCSS modules
* [ ] Нет дублирования
* [ ] Есть JSDoc для публичных API
