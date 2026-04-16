import type { User } from "@/types";

export const mockUsers: User[] = [
  {
    id: "user-001",
    name: "Алексей Иванов",
    email: "a.ivanov@example.com",
    role: "inspector",
  },
  {
    id: "user-002",
    name: "Мария Петрова",
    email: "m.petrova@example.com",
    role: "inspector",
  },
  {
    id: "user-003",
    name: "Дмитрий Соколов",
    email: "d.sokolov@example.com",
    role: "inspector",
  },
  {
    id: "user-004",
    name: "Елена Орлова",
    email: "e.orlova@example.com",
    role: "supervisor",
  },
];

export function getUserById(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}
