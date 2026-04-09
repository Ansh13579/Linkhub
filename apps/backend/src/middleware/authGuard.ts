import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;       // user UUID
  tenant_id: string; // tenant UUID — the key multi-tenant scoping claim
  role: string;      // owner | member
  iat: number;
  exp: number;
}

// Extend Express Request to carry tenant context
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authentication guard middleware.
 * Validates JWT and attaches decoded payload to req.user.
 * Strictly enforces that tenant_id is present in the token.
 */
export function authGuard(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Strict check: ensure tenant_id claim is present
    if (!decoded.tenant_id) {
      return res.status(403).json({ error: 'Token missing tenant scope' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Tenant scope middleware — must run AFTER authGuard.
 * Verifies that the requested resource belongs to the token's tenant.
 * This is the IDOR protection layer: even if someone guesses a UUID,
 * the tenant_id mismatch will block access.
 */
export function requireTenantMatch(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestedTenantId = req.params.tenantId || req.body?.tenant_id;
  if (requestedTenantId && requestedTenantId !== req.user?.tenant_id) {
    return res.status(403).json({ error: 'Cross-tenant access denied' });
  }
  next();
}
