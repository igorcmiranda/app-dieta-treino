import { RowDataPacket } from 'mysql2/promise';
import { User } from '@/lib/types';

export type UserRow = RowDataPacket & {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  cpf: string | null;
  is_admin: 0 | 1;
  email_verified: 0 | 1;
  profile_json: any;
  subscription_json: any;
  billing_json: any;
  created_at: string;
};

function parseJsonField(value: any) {
  if (!value) return undefined;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: '',
    phone: row.phone || undefined,
    cpf: row.cpf || undefined,
    isAdmin: Boolean(row.is_admin),
    emailVerified: Boolean(row.email_verified),
    profile: parseJsonField(row.profile_json),
    subscription: parseJsonField(row.subscription_json),
    billing: parseJsonField(row.billing_json),
    createdAt: new Date(row.created_at),
  };
}
