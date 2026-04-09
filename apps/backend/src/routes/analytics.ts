import { Router, Request, Response } from 'express';
import { authGuard } from '../middleware/authGuard';
import { tenantQuery, query } from '../db/client';

const router = Router();
router.use(authGuard);

// ── GET /api/analytics/summary ─────────────────────────────────────────────────
// Total clicks, top link, today's clicks
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;

    const [totals, todayClicks, topLink] = await Promise.all([
      // All-time totals
      query(
        `SELECT COUNT(*) as total_clicks,
                COUNT(DISTINCT link_id) as active_links_count
         FROM click_events WHERE tenant_id = $1`,
        [tenantId]
      ),
      // Today's clicks
      query(
        `SELECT COUNT(*) as today_clicks
         FROM click_events
         WHERE tenant_id = $1 AND clicked_at >= CURRENT_DATE`,
        [tenantId]
      ),
      // Top performing link
      query(
        `SELECT l.title, COUNT(ce.id) as clicks
         FROM click_events ce
         JOIN links l ON l.id = ce.link_id
         WHERE ce.tenant_id = $1
         GROUP BY l.id, l.title
         ORDER BY clicks DESC
         LIMIT 1`,
        [tenantId]
      ),
    ]);

    // 7-day trend (clicks per day)
    const weekTrend = await query(
      `SELECT DATE(clicked_at) as date, COUNT(*) as clicks
       FROM click_events
       WHERE tenant_id = $1 AND clicked_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(clicked_at)
       ORDER BY date ASC`,
      [tenantId]
    );

    return res.json({
      total_clicks: parseInt(totals[0]?.total_clicks || '0'),
      today_clicks: parseInt(todayClicks[0]?.today_clicks || '0'),
      top_link: topLink[0] || null,
      week_trend: weekTrend,
    });
  } catch (err) {
    console.error('Analytics summary error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

// ── GET /api/analytics/heatmap ─────────────────────────────────────────────────
// Click distribution by hour of day (24-hour visualization)
router.get('/heatmap', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;

    // Generate all 24 hours, even empty ones
    const rows = await query(
      `SELECT hour_of_day, COUNT(*) as clicks
       FROM click_events
       WHERE tenant_id = $1
       GROUP BY hour_of_day
       ORDER BY hour_of_day ASC`,
      [tenantId]
    );

    // Fill missing hours with 0
    const heatmap: { hour: number; clicks: number; label: string }[] = [];
    const rowMap = new Map(rows.map((r: any) => [r.hour_of_day, parseInt(r.clicks)]));

    for (let h = 0; h < 24; h++) {
      const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
      heatmap.push({ hour: h, clicks: rowMap.get(h) || 0, label });
    }

    return res.json(heatmap);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// ── GET /api/analytics/links ───────────────────────────────────────────────────
// Per-link click performance ranking
router.get('/links', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;

    const result = await query(
      `SELECT l.id, l.title, l.url, l.icon, l.position,
              COUNT(ce.id) as total_clicks,
              COUNT(CASE WHEN ce.clicked_at >= NOW() - INTERVAL '7 days' THEN 1 END) as week_clicks,
              COUNT(CASE WHEN ce.clicked_at >= CURRENT_DATE THEN 1 END) as today_clicks
       FROM links l
       LEFT JOIN click_events ce ON ce.link_id = l.id AND ce.tenant_id = $1
       WHERE l.tenant_id = $1
       GROUP BY l.id, l.title, l.url, l.icon, l.position
       ORDER BY total_clicks DESC`,
      [tenantId]
    );

    const total = result.reduce((s: number, r: any) => s + parseInt(r.total_clicks), 0);
    const withPercent = result.map((r: any) => ({
      ...r,
      total_clicks: parseInt(r.total_clicks),
      week_clicks: parseInt(r.week_clicks),
      today_clicks: parseInt(r.today_clicks),
      percentage: total > 0 ? Math.round((parseInt(r.total_clicks) / total) * 100) : 0,
    }));

    return res.json(withPercent);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch link analytics' });
  }
});

// ── GET /api/analytics/sources ─────────────────────────────────────────────────
// Traffic source breakdown
router.get('/sources', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;

    const result = await query(
      `SELECT traffic_source as source, COUNT(*) as clicks
       FROM click_events
       WHERE tenant_id = $1
       GROUP BY traffic_source
       ORDER BY clicks DESC`,
      [tenantId]
    );

    const total = result.reduce((s: number, r: any) => s + parseInt(r.clicks), 0);
    const withPercent = result.map((r: any) => ({
      source: r.source,
      clicks: parseInt(r.clicks),
      percentage: total > 0 ? Math.round((parseInt(r.clicks) / total) * 100) : 0,
    }));

    return res.json(withPercent);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch traffic sources' });
  }
});

// ── GET /api/analytics/devices ─────────────────────────────────────────────────
router.get('/devices', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;

    const result = await query(
      `SELECT device, COUNT(*) as clicks
       FROM click_events WHERE tenant_id = $1
       GROUP BY device ORDER BY clicks DESC`,
      [tenantId]
    );

    const total = result.reduce((s: number, r: any) => s + parseInt(r.clicks), 0);
    return res.json(result.map((r: any) => ({
      device: r.device,
      clicks: parseInt(r.clicks),
      percentage: total > 0 ? Math.round((parseInt(r.clicks) / total) * 100) : 0,
    })));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch device data' });
  }
});

// ── POST /api/analytics/click ──────────────────────────────────────────────────
// Record a click event (public endpoint, called from profile page)
router.post('/click', async (req: Request, res: Response) => {
  try {
    const { link_id, tenant_id, traffic_source, device } = req.body;

    if (!link_id || !tenant_id) {
      return res.status(400).json({ error: 'link_id and tenant_id are required' });
    }

    // Verify link belongs to tenant (IDOR protection without RLS)
    const link = await query(
      `SELECT id FROM links WHERE id = $1 AND tenant_id = $2`,
      [link_id, tenant_id]
    );
    if (link.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const now = new Date();
    await query(
      `INSERT INTO click_events (tenant_id, link_id, hour_of_day, day_of_week, traffic_source, device)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        tenant_id, link_id,
        now.getHours(), now.getDay(),
        traffic_source || 'direct',
        device || 'mobile',
      ]
    );

    // Update click count on link
    await query(
      `UPDATE links SET click_count = click_count + 1 WHERE id = $1`,
      [link_id]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Click event error:', err);
    return res.status(500).json({ error: 'Failed to record click' });
  }
});

export default router;
