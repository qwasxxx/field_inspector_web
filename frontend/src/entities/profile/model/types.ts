export type ProfileRole = 'admin' | 'worker';

export type ProfileRow = {
  id: string;
  full_name: string;
  username: string;
  employee_code: string;
  role: ProfileRole;
  is_active: boolean;
  created_at: string;
};
