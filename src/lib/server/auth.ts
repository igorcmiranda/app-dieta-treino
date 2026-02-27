import { SignOptions, verify, sign } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'fitai_session';

type SessionPayload = {
  userId: string;
  email: string;
  isAdmin: boolean;
  name: string;
};

function getJwtSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error('AUTH_JWT_SECRET não configurado.');
  }
  return secret;
}

export function signSession(payload: SessionPayload): string {
  const options: SignOptions = { expiresIn: '7d' };
  return sign(payload, getJwtSecret(), options);
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = verify(token, getJwtSecret());
    return decoded as SessionPayload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
