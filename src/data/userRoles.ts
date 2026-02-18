// src/data/userRoles.ts

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export const userRoles: UserRole[] = [
  {
    id: 'admin',
    name: 'Administrator',
    permissions: ['manage_users', 'edit_content', 'view_reports', 'full_access'],
  },
  {
    id: 'student',
    name: 'Student',
    permissions: ['view_content', 'attempt_questions', 'view_progress'],
  },
];
