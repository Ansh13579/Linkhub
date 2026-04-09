import { Router, Request, Response } from 'express';
import { authGuard } from '../middleware/authGuard';
import { query, tenantQuery } from '../db/client';

const router = Router();

// ── GET /api/tenants/profile ── Authenticated tenant's own profile ─────────────
router.get('/profile', authGuard, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;
    const result = await query(
      `SELECT t.id, t.slug, t.name, t.bio, t.avatar_url, t.plan, t.created_at,
              th.primary_color, th.secondary_color, th.background_color, th.text_color,
              th.card_color, th.font_family, th.button_style, th.button_radius,
              th.background_type, th.background_value
       FROM tenants t
       LEFT JOIN themes th ON th.tenant_id = t.id
       WHERE t.id = $1`,
      [tenantId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    return res.json(result[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ── PUT /api/tenants/profile ── Update profile ────────────────────────────────
router.put('/profile', authGuard, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;
    const { name, bio, avatar_url } = req.body;

    const result = await query(
      `UPDATE tenants SET name = COALESCE($1, name), bio = COALESCE($2, bio), 
       avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4 RETURNING id, slug, name, bio, avatar_url`,
      [name, bio, avatar_url, tenantId]
    );

    return res.json(result[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── PUT /api/tenants/theme ── Update theme ────────────────────────────────────
router.put('/theme', authGuard, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;
    const {
      primary_color, secondary_color, background_color, text_color,
      card_color, font_family, button_style, button_radius,
      background_type, background_value,
    } = req.body;

    const result = await tenantQuery(
      tenantId,
      `UPDATE themes SET
        primary_color       = COALESCE($1,  primary_color),
        secondary_color     = COALESCE($2,  secondary_color),
        background_color    = COALESCE($3,  background_color),
        text_color          = COALESCE($4,  text_color),
        card_color          = COALESCE($5,  card_color),
        font_family         = COALESCE($6,  font_family),
        button_style        = COALESCE($7,  button_style),
        button_radius       = COALESCE($8,  button_radius),
        background_type     = COALESCE($9,  background_type),
        background_value    = COALESCE($10, background_value)
       WHERE tenant_id = $11
       RETURNING *`,
      [
        primary_color, secondary_color, background_color, text_color,
        card_color, font_family, button_style, button_radius,
        background_type, background_value, tenantId,
      ]
    );

    return res.json(result[0]);
  } catch (err) {
    console.error('Update theme error:', err);
    return res.status(500).json({ error: 'Failed to update theme' });
  }
});

// ── GET /api/tenants/public/:slug ── Public profile (NO AUTH) ────────────────
router.get('/public/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const tenantResult = await query(
      `SELECT t.id, t.slug, t.name, t.bio, t.avatar_url,
              th.primary_color, th.secondary_color, th.background_color, th.text_color,
              th.card_color, th.font_family, th.button_style, th.button_radius,
              th.background_type, th.background_value
       FROM tenants t
       LEFT JOIN themes th ON th.tenant_id = t.id
       WHERE t.slug = $1`,
      [slug]
    );

    if (tenantResult.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const tenant = tenantResult[0];

    // Fetch active links for this tenant (no RLS needed – public data)
    const links = await query(
      `SELECT id, title, url, icon, description, position, click_count
       FROM links
       WHERE tenant_id = $1 AND is_active = true
       ORDER BY position ASC`,
      [tenant.id]
    );

    return res.json({ tenant, links });
  } catch (err) {
    console.error('Public profile error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
