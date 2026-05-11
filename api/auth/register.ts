import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '../_lib/firebase-admin';
import {
  formatMemberId,
  hashPin,
  readJsonBody,
  syntheticEmail,
  validatePayload
} from '../_lib/auth-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  }

  try {
    const payload = validatePayload(readJsonBody(req.body));
    const usernameRef = adminDb.collection('usernames').doc(payload.username);
    const counterRef = adminDb.collection('app_meta').doc('counters');
    const uid = randomUUID();

    const result = await adminDb.runTransaction(async (tx) => {
      const [usernameSnap, counterSnap] = await Promise.all([
        tx.get(usernameRef),
        tx.get(counterRef)
      ]);

      if (usernameSnap.exists) {
        throw new Error('Esse nome de usuário já está em uso.');
      }

      const currentCounter = Number(counterSnap.data()?.lastUserNumber || 0);
      const nextCounter = currentCounter + 1;
      const memberId = formatMemberId(nextCounter);
      const { salt, hash } = hashPin(payload.pin);

      tx.set(counterRef, { lastUserNumber: nextCounter, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      tx.set(usernameRef, {
        uid,
        username: payload.username,
        memberId,
        createdAt: FieldValue.serverTimestamp()
      });
      tx.set(adminDb.collection('users').doc(uid), {
        uid,
        memberId,
        username: payload.username,
        authMethod: 'pin',
        pinSalt: salt,
        pinHash: hash,
        rememberDeviceDefault: payload.rememberDevice,
        displayName: payload.username,
        email: syntheticEmail(payload.username),
        photoURL: '',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      return { memberId };
    });

    await adminAuth.createUser({
      uid,
      displayName: payload.username,
      email: syntheticEmail(payload.username)
    });

    const token = await adminAuth.createCustomToken(uid, {
      authMethod: 'pin',
      memberId: result.memberId,
      username: payload.username
    });

    return res.status(201).json({
      token,
      user: {
        uid,
        memberId: result.memberId,
        username: payload.username,
        authMethod: 'pin'
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Não consegui criar a conta.';
    const status = message.includes('já está em uso') ? 409 : 400;
    return res.status(status).json({ error: message });
  }
}
