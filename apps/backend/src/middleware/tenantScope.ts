import { Request, Response, NextFunction } from 'express';

/**
 * Tenant scope middleware.
 * In production this would extract the tenant slug from the subdomain:
 *   e.g. "alexdesigns.linkhub.io" → slug = "alexdesigns"
 *
 * For local development we use path-based routing: /t/:slug
 * The tenant_id is already captured via JWT in the authGuard middleware.
 *
 * This middleware logs the active tenant for every scoped request.
 */
export function tenantScopeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // In subdomain-based setup, you would do:
  // const host = req.hostname; // e.g. "alexdesigns.linkhub.io"
  // const slug = host.split('.')[0];
  // Then look up tenant_id by slug and attach to req

  // For JWT-authenticated routes, tenant_id comes from token (set by authGuard)
  if (req.user?.tenant_id) {
    res.setHeader('X-Tenant-ID', req.user.tenant_id);
  }

  next();
}
