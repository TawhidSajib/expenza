import { User } from '../types';

/**
 * Known default owner/creator email for the Expenza application.
 * You can also specify or override owner emails via the VITE_OWNER_EMAIL
 * environment variable (comma-separated if multiple).
 */
export const DEFAULT_OWNER_EMAILS: readonly string[] = [
  'tawhidsajib9@gmail.com',
];

/**
 * Determines whether the given user is the application owner / creator.
 *
 * Checks:
 * 1. user.isOwner or user.role === 'owner'
 * 2. User's email matches the app creator email ('tawhidsajib9@gmail.com')
 * 3. User's email is listed in the VITE_OWNER_EMAIL or VITE_ADMIN_EMAIL environment variable
 */
export function isAppOwner(user: User | null | undefined): boolean {
  if (!user) return false;

  // Explicit flag
  if (user.isOwner === true || user.role === 'owner') {
    return true;
  }

  if (!user.email) return false;
  const normalizedEmail = user.email.trim().toLowerCase();

  // Environment variable overrides (e.g. for Vercel deployment)
  const envOwnerEmails = [
    ...(import.meta.env.VITE_OWNER_EMAIL ? String(import.meta.env.VITE_OWNER_EMAIL).split(',') : []),
    ...(import.meta.env.VITE_ADMIN_EMAIL ? String(import.meta.env.VITE_ADMIN_EMAIL).split(',') : []),
  ]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const allOwnerEmails = new Set([
    ...DEFAULT_OWNER_EMAILS.map((e) => e.toLowerCase()),
    ...envOwnerEmails,
  ]);

  return allOwnerEmails.has(normalizedEmail);
}
