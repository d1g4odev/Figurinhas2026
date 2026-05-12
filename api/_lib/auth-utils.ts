import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const PIN_PATTERN = /^\d{4}$/;

export type PinAccountPayload = {
  username: string;
  pin: string;
  rememberDevice?: boolean;
};

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}

export function isValidPin(value: string) {
  return PIN_PATTERN.test(value.trim());
}

export function validatePayload(payload: Partial<PinAccountPayload>) {
  const username = normalizeUsername(payload.username || '');
  const pin = String(payload.pin || '').trim();

  if (!isValidUsername(username)) {
    throw new Error('Use um nome de usuário com 3 a 20 caracteres: letras minúsculas, números ou _.');
  }

  if (!isValidPin(pin)) {
    throw new Error('O PIN deve ter exatamente 4 números.');
  }

  return {
    username,
    pin,
    rememberDevice: payload.rememberDevice !== false
  };
}

export function hashPin(pin: string, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(pin, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPin(pin: string, salt: string, hash: string) {
  const candidate = scryptSync(pin, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function formatMemberId(number: number) {
  return String(number).padStart(4, '0');
}

export function syntheticEmail(username: string) {
  return `${normalizeUsername(username)}@users.figs2026.app`;
}

export function readJsonBody(body: unknown) {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  if (body instanceof Buffer) {
    try {
      return JSON.parse(body.toString('utf8')) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  if (!body || typeof body !== 'object') {
    return {};
  }
  return body as Record<string, unknown>;
}
