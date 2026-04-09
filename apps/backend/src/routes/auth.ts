import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/client';

const router = Router();

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, slug } = req.body;

    if (!email || !password || !name || !slug) {
      return res.status(400).json({ error: 'email, password, name, and slug are required' });
    }

    // Validate slug format
    if (!/^[a-z0-9_-]{3,30}$/.test(slug)) {
      return res.status(400).json({
        error: 'Slug must be 3–30 characters, lowercase letters, numbers, hyphens, underscores only',
      });
    }

    // Check slug uniqueness
    const existing = await query('SELECT id FROM tenants WHERE slug = $1', [slug]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Slug already taken' });
    }

    // Check email uniqueness
    const emailExists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailExists.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create tenant with default avatar
    const defaultAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${slug}`;
    const tenantResult = await query(
      `INSERT INTO tenants (slug, name, avatar_url) VALUES ($1, $2, $3) RETURNING id, slug, name, created_at`,
      [slug, name, defaultAvatarUrl]
    );
    const tenant = tenantResult[0];

    // Create default theme
    await query(
      `INSERT INTO themes (tenant_id) VALUES ($1)`,
      [tenant.id]
    );

    // Create 3 starter links so the user has something to edit from the start
    const starterLinks = [
      { title: 'My Website', url: 'https://example.com', icon: '🌐', position: 0 },
      { title: 'GitHub', url: 'https://github.com', icon: '💻', position: 1 },
      { title: 'LinkedIn', url: 'https://linkedin.com', icon: '💼', position: 2 },
    ];
    for (const link of starterLinks) {
      await query(
        `INSERT INTO links (tenant_id, title, url, icon, position) VALUES ($1, $2, $3, $4, $5)`,
        [tenant.id, link.title, link.url, link.icon, link.position]
      );
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 12);
    const userResult = await query(
      `INSERT INTO users (tenant_id, email, password_hash, role)
       VALUES ($1, $2, $3, 'owner') RETURNING id, email, role`,
      [tenant.id, email.toLowerCase(), passwordHash]
    );
    const user = userResult[0];

    // Generate JWT with tenant claims
    const token = jwt.sign(
      { sub: user.id, tenant_id: tenant.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // Fetch user + tenant in one join
    const result = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.tenant_id,
              t.slug, t.name, t.bio, t.avatar_url
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (result.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { sub: user.id, tenant_id: user.tenant_id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
      tenant: {
        id: user.tenant_id,
        slug: user.slug,
        name: user.name,
        bio: user.bio,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
import { authGuard } from '../middleware/authGuard';

router.get('/me', authGuard, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.role, t.id as tenant_id, t.slug, t.name, t.bio, t.avatar_url, t.plan
       FROM users u JOIN tenants t ON t.id = u.tenant_id
       WHERE u.id = $1`,
      [req.user!.sub]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(result[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
