import { Router, Request, Response } from 'express';
import { authGuard } from '../middleware/authGuard';
import { tenantQuery, tenantTransaction } from '../db/client';

const router = Router();

// All routes require authentication
router.use(authGuard);

// ── GET /api/links ─────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;
    const links = await tenantQuery(
      tenantId,
      `SELECT id, title, url, icon, description, position, is_active, click_count, thumbnail_url, created_at, updated_at
       FROM links
       WHERE tenant_id = $1
       ORDER BY position ASC`,
      [tenantId]
    );
    return res.json(links);
  } catch (err) {
    console.error('Get links error:', err);
    return res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// ── POST /api/links ────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;
    const { title, url, icon, description } = req.body;

    if (!title || !url) {
      return res.status(400).json({ error: 'title and url are required' });
    }

    // Simple URL validation
    try { new URL(url); } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const link = await tenantTransaction(tenantId, async (client) => {
      // Get max position
      const posResult = await client.query(
        `SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM links WHERE tenant_id = $1`,
        [tenantId]
      );
      const position = posResult.rows[0].next_pos;

      const result = await client.query(
        `INSERT INTO links (tenant_id, title, url, icon, description, position)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, url, icon, description, position, is_active, click_count, created_at`,
        [tenantId, title, url, icon || null, description || null, position]
      );
      return result.rows[0];
    });

    return res.status(201).json(link);
  } catch (err) {
    console.error('Create link error:', err);
    return res.status(500).json({ error: 'Failed to create link' });
  }
});

// ── PUT /api/links/reorder ─────────────────────────────────────────────────────
router.put('/reorder', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;
    const { orderedIds } = req.body; // Array of link UUIDs in new order

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ error: 'orderedIds must be a non-empty array' });
    }

    await tenantTransaction(tenantId, async (client) => {
      for (let i = 0; i < orderedIds.length; i++) {
        // Double-check: only update links that belong to this tenant (RLS + explicit filter)
        await client.query(
          `UPDATE links SET position = $1 WHERE id = $2 AND tenant_id = $3`,
          [i, orderedIds[i], tenantId]
        );
      }
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Reorder links error:', err);
    return res.status(500).json({ error: 'Failed to reorder links' });
  }
});

// ── PUT /api/links/:id ─────────────────────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;
    const { id } = req.params;
    const { title, url, icon, description, is_active } = req.body;

    if (url) {
      try { new URL(url); } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
    }

    // Build dynamic update (only update provided fields)
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) { updates.push(`title = $${paramIndex++}`); values.push(title); }
    if (url !== undefined) { updates.push(`url = $${paramIndex++}`); values.push(url); }
    if (icon !== undefined) { updates.push(`icon = $${paramIndex++}`); values.push(icon); }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(description); }
    if (is_active !== undefined) { updates.push(`is_active = $${paramIndex++}`); values.push(is_active); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // tenant_id check is both in WHERE clause AND enforced by RLS
    values.push(id, tenantId);
    const result = await tenantQuery(
      tenantId,
      `UPDATE links SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
       RETURNING id, title, url, icon, description, position, is_active, click_count`,
      values
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    return res.json(result[0]);
  } catch (err) {
    console.error('Update link error:', err);
    return res.status(500).json({ error: 'Failed to update link' });
  }
});

// ── DELETE /api/links/:id ──────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;
    const { id } = req.params;

    const result = await tenantQuery(
      tenantId,
      `DELETE FROM links WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [id, tenantId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Delete link error:', err);
    return res.status(500).json({ error: 'Failed to delete link' });
  }
});

export default router;
