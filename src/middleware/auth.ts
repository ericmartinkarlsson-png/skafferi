import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken | { uid: string; email: string };
}

const PASSCODE = 'Björnstugan1337';

function isPasscodeValid(headerVal: unknown): boolean {
  if (!headerVal || typeof headerVal !== 'string') return false;
  const str = headerVal.trim();
  if (str === PASSCODE || str === 'BjÃ¶rnstugan1337' || str === encodeURIComponent(PASSCODE)) {
    return true;
  }
  try {
    if (decodeURIComponent(str) === PASSCODE) return true;
  } catch {
    // ignore
  }
  try {
    const fromLatin1 = Buffer.from(str, 'latin1').toString('utf8');
    if (fromLatin1 === PASSCODE) return true;
  } catch {
    // ignore
  }
  try {
    if (str.normalize('NFC') === PASSCODE.normalize('NFC')) return true;
  } catch {
    // ignore
  }
  return false;
}

export const requireCabinAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const passcodeHeader = req.headers['x-cabin-passcode'];
  const authHeader = req.headers.authorization;

  // Option 1: Passcode header matches Björnstugan1337
  if (isPasscodeValid(passcodeHeader)) {
    req.user = { uid: 'cabin-user', email: 'cabin@bjornstugan.local' };
    return next();
  }

  // Option 2: Bearer token is passcode
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (isPasscodeValid(token)) {
      req.user = { uid: 'cabin-user', email: 'cabin@bjornstugan.local' };
      return next();
    }
    // Option 3: Firebase Bearer token if configured
    try {
      if (adminAuth && adminAuth.verifyIdToken) {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
        return next();
      }
    } catch {
      // ignore
    }
  }

  return res.status(401).json({ error: 'Obehörig: Ogiltig lösenkod eller session.' });
};

