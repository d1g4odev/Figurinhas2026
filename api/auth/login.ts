import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminAuth, adminDb } from '../_lib/firebase-admin.ts';
import { readJsonBody, validatePayload, verifyPin } from '../_lib/auth-utils.ts';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function rateLimitKey(req: VercelRequest, username: string) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  return `${ip}:${username}`;
}

function enforceRateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  if (current.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    const error = new Error('Muitas tentativas. Tente novamente em alguns minutos.');
    (error as Error & { retryAfter?: number }).retryAfter = retryAfter;
    throw error;
  }

  current.count += 1;
}

function clearRateLimit(key: string) {
  attempts.delete(key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  }

  try {
    const payload = validatePayload(readJsonBody(req.body));
    const limitKey = rateLimitKey(req, payload.username);
    enforceRateLimit(limitKey);

    const usernameSnap = await adminDb.collection('usernames').doc(payload.username).get();
    const uid = usernameSnap.data()?.uid as string | undefined;
    if (!uid) {
      return res.status(401).json({ error: 'Usuário ou PIN inválido.' });
    }

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data();
    if (!userData?.pinSalt || !userData?.pinHash) {
      return res.status(401).json({ error: 'Usuário ou PIN inválido.' });
    }

    const valid = verifyPin(payload.pin, userData.pinSalt, userData.pinHash);
    if (!valid) {
      return res.status(401).json({ error: 'Usuário ou PIN inválido.' });
    }

    clearRateLimit(limitKey);

    const token = await adminAuth.createCustomToken(uid, {
      authMethod: 'pin',
      memberId: userData.memberId,
      username: userData.username
    });

    return res.status(200).json({
      token,
      user: {
        uid,
        memberId: userData.memberId,
        username: userData.username,
        authMethod: 'pin'
      }
    });
  } catch (error: unknown) {
    const retryAfter = typeof error === 'object' && error && 'retryAfter' in error ? Number((error as { retryAfter: number }).retryAfter) : 0;
    if (retryAfter) {
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' });
    }

    const message = error instanceof Error ? error.message : 'Não consegui entrar na conta.';
    return res.status(400).json({ error: message });
  }
}
