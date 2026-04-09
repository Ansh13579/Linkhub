import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { pool, query } from './client';
import dotenv from 'dotenv';

dotenv.config();

// ── Tenant theme presets ──────────────────────────────────────────────────────
const THEME_PRESETS = [
  {
    name: 'Neon Dark',
    primary_color: '#A855F7',
    secondary_color: '#06B6D4',
    background_color: '#0a0a0f',
    text_color: '#f0f0ff',
    card_color: 'rgba(168,85,247,0.1)',
    font_family: 'Space Grotesk',
    button_style: 'outline',
    button_radius: '8px',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0f 0%, #120024 100%)',
  },
  {
    name: 'Soft Pastel',
    primary_color: '#8B5CF6',
    secondary_color: '#EC4899',
    background_color: '#faf5ff',
    text_color: '#1e1b4b',
    card_color: 'rgba(139,92,246,0.08)',
    font_family: 'DM Sans',
    button_style: 'soft',
    button_radius: '24px',
    background_type: 'solid',
    background_value: '#faf5ff',
  },
  {
    name: 'Bold Gradient',
    primary_color: '#ffffff',
    secondary_color: '#fbbf24',
    background_color: '#ff6b6b',
    text_color: '#ffffff',
    card_color: 'rgba(255,255,255,0.15)',
    font_family: 'Outfit',
    button_style: 'filled',
    button_radius: '16px',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #ff6b6b 0%, #ee0979 40%, #7c3aed 100%)',
  },
  {
    name: 'Ocean Breeze',
    primary_color: '#06B6D4',
    secondary_color: '#0EA5E9',
    background_color: '#0c1929',
    text_color: '#e0f7fa',
    card_color: 'rgba(6,182,212,0.1)',
    font_family: 'Inter',
    button_style: 'filled',
    button_radius: '12px',
    background_type: 'gradient',
    background_value: 'linear-gradient(180deg, #0c1929 0%, #0a2a3d 100%)',
  },
  {
    name: 'Minimal Light',
    primary_color: '#111827',
    secondary_color: '#6B7280',
    background_color: '#ffffff',
    text_color: '#111827',
    card_color: 'rgba(17,24,39,0.05)',
    font_family: 'Inter',
    button_style: 'outline',
    button_radius: '6px',
    background_type: 'solid',
    background_value: '#ffffff',
  },
];

// ── Demo tenant data ──────────────────────────────────────────────────────────
const TENANTS = [
  {
    slug: 'alexdesigns',
    name: 'Alex Chen',
    bio: 'UI/UX Designer & Creative Director based in NYC ✨ Helping brands tell their visual stories.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alexdesigns',
    email: 'alex@linkhub.dev',
    password: 'password123',
    links: [
      { title: 'Portfolio Website', url: 'https://alexchen.design', icon: '🎨' },
      { title: 'Dribbble', url: 'https://dribbble.com/alexchen', icon: '🏀' },
      { title: 'Instagram', url: 'https://instagram.com/alexdesigns', icon: '📸' },
      { title: 'Book a Design Call', url: 'https://cal.com/alexchen', icon: '📅' },
      { title: 'UI Kit – Free Download', url: 'https://gumroad.com/alexchen/uikit', icon: '🎁' },
      { title: 'YouTube Channel', url: 'https://youtube.com/@alexdesigns', icon: '▶️' },
    ],
    themeIndex: 0,
  },
  {
    slug: 'sarahcodes',
    name: 'Sarah Park',
    bio: 'Full-stack developer 👩‍💻 Open source contributor | Writing about React, TypeScript & system design',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarahcodes',
    email: 'sarah@linkhub.dev',
    password: 'password123',
    links: [
      { title: 'GitHub', url: 'https://github.com/sarahpark', icon: '💻' },
      { title: 'Tech Blog', url: 'https://sarahcodes.dev', icon: '✍️' },
      { title: 'Twitter / X', url: 'https://twitter.com/sarahcodes', icon: '🐦' },
      { title: 'LinkedIn', url: 'https://linkedin.com/in/sarahpark', icon: '💼' },
      { title: 'Latest Course: React Mastery', url: 'https://courses.sarahcodes.dev', icon: '🚀' },
      { title: 'Newsletter', url: 'https://sarahcodes.substack.com', icon: '📩' },
      { title: 'Sponsor My Work', url: 'https://github.com/sponsors/sarahpark', icon: '❤️' },
    ],
    themeIndex: 1,
  },
  {
    slug: 'marcusbrand',
    name: 'Marcus Wright',
    bio: 'Brand Strategist & Marketing Consultant 🔥 Helped 200+ brands scale. Speaker | Author | Podcaster',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcusbrand',
    email: 'marcus@linkhub.dev',
    password: 'password123',
    links: [
      { title: 'Book: "Brand Blueprint"', url: 'https://amazon.com/dp/brandblueprint', icon: '📚' },
      { title: 'The Brand Strategy Podcast', url: 'https://spotify.com/show/brandstrategy', icon: '🎙️' },
      { title: 'Hire Me for Speaking', url: 'https://marcuswright.com/speaking', icon: '🎤' },
      { title: 'Brand Audit – Free Tool', url: 'https://brandaudit.marcuswright.com', icon: '🔍' },
      { title: 'Agency', url: 'https://wrightbranding.co', icon: '🏢' },
      { title: 'YouTube: Brand Tips', url: 'https://youtube.com/@marcuswright', icon: '📺' },
    ],
    themeIndex: 2,
  },
  {
    slug: 'lunafitness',
    name: 'Luna Rodriguez',
    bio: 'Certified Personal Trainer 💪 Nutrition Coach | Online Programs | Join 50k+ on this fitness journey!',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lunafitness',
    email: 'luna@linkhub.dev',
    password: 'password123',
    links: [
      { title: '12-Week Transformation Program', url: 'https://lunafitness.com/program', icon: '🏋️' },
      { title: 'Free Meal Plan', url: 'https://lunafitness.com/mealplan', icon: '🥗' },
      { title: 'Instagram Workouts', url: 'https://instagram.com/lunafitness', icon: '📸' },
      { title: 'TikTok', url: 'https://tiktok.com/@lunafitness', icon: '🎵' },
      { title: 'Coaching Inquiry', url: 'https://lunafitness.com/coaching', icon: '🤝' },
      { title: 'Supplement Recommendations', url: 'https://amazon.com/shop/lunafit', icon: '💊' },
    ],
    themeIndex: 3,
  },
  {
    slug: 'quantumstudio',
    name: 'Quantum Studio',
    bio: 'Indie game studio 🎮 | Crafting immersive experiences | Working on "Echoes of Eternity" | Wishlist now!',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=quantumstudio',
    email: 'studio@linkhub.dev',
    password: 'password123',
    links: [
      { title: 'Steam Wishlist', url: 'https://store.steampowered.com/app/echoesofeternity', icon: '🎮' },
      { title: 'Dev Blog', url: 'https://quantumstudio.io/blog', icon: '📝' },
      { title: 'Discord Community', url: 'https://discord.gg/quantumstudio', icon: '💬' },
      { title: 'Patreon', url: 'https://patreon.com/quantumstudio', icon: '🎪' },
      { title: 'Itch.io (Free Games)', url: 'https://quantumstudio.itch.io', icon: '🕹️' },
      { title: 'Twitter Updates', url: 'https://twitter.com/quantumstudio', icon: '🐦' },
    ],
    themeIndex: 4,
  },
];

// ── Traffic sources distribution ──────────────────────────────────────────────
const TRAFFIC_SOURCES = [
  { source: 'direct', weight: 40 },
  { source: 'instagram', weight: 20 },
  { source: 'twitter', weight: 10 },
  { source: 'tiktok', weight: 8 },
  { source: 'google', weight: 12 },
  { source: 'facebook', weight: 5 },
  { source: 'referral', weight: 5 },
];

const COUNTRIES = ['US', 'UK', 'CA', 'AU', 'IN', 'DE', 'FR', 'BR', 'JP', 'MX'];
const DEVICES = ['mobile', 'mobile', 'mobile', 'desktop', 'tablet']; // 60% mobile

function weightedRandom(items: { weight: number }[]) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

// Gaussian distribution for realistic peak hours (peak at 14:00, spread 4h)
function gaussianHour(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const n = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  const hour = Math.round(14 + n * 4);
  return Math.max(0, Math.min(23, hour));
}

async function seed() {
  const client = await pool.connect();
  console.log('🌱 Starting database seed...\n');

  try {
    await client.query('BEGIN');

    // Clear existing data (order matters for FK constraints)
    console.log('🧹 Clearing existing data...');
    await client.query('DELETE FROM click_events');
    await client.query('DELETE FROM links');
    await client.query('DELETE FROM themes');
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM tenants');

    for (let i = 0; i < TENANTS.length; i++) {
      const tenantData = TENANTS[i];
      const theme = THEME_PRESETS[tenantData.themeIndex];

      console.log(`\n📦 Seeding tenant: ${tenantData.name} (@${tenantData.slug})`);

      // 1. Create tenant
      const tenantResult = await client.query(
        `INSERT INTO tenants (slug, name, bio, avatar_url) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [tenantData.slug, tenantData.name, tenantData.bio, tenantData.avatar_url]
      );
      const tenantId = tenantResult.rows[0].id;

      // 2. Create user for this tenant
      const passwordHash = await bcrypt.hash(tenantData.password, 10);
      await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, role)
         VALUES ($1, $2, $3, 'owner')`,
        [tenantId, tenantData.email, passwordHash]
      );

      // 3. Create theme
      await client.query(
        `INSERT INTO themes (tenant_id, primary_color, secondary_color, background_color, 
         text_color, card_color, font_family, button_style, button_radius, background_type, background_value)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          tenantId,
          theme.primary_color, theme.secondary_color, theme.background_color,
          theme.text_color, theme.card_color, theme.font_family, theme.button_style,
          theme.button_radius, theme.background_type, theme.background_value,
        ]
      );

      // 4. Create links
      const linkIds: string[] = [];
      for (let pos = 0; pos < tenantData.links.length; pos++) {
        const link = tenantData.links[pos];
        const clickCount = faker.number.int({ min: 200, max: 5000 });
        const linkResult = await client.query(
          `INSERT INTO links (tenant_id, title, url, icon, position, is_active, click_count)
           VALUES ($1, $2, $3, $4, $5, true, $6) RETURNING id`,
          [tenantId, link.title, link.url, link.icon, pos, clickCount]
        );
        linkIds.push(linkResult.rows[0].id);
      }

      // 5. Generate click events (5,000–12,000 per tenant over 90 days)
      const totalClicks = faker.number.int({ min: 5000, max: 12000 });
      console.log(`   📊 Generating ${totalClicks} click events...`);

      const clickEvents: any[] = [];
      for (let c = 0; c < totalClicks; c++) {
        const daysAgo = faker.number.int({ min: 0, max: 90 });
        const clickDate = new Date();
        clickDate.setDate(clickDate.getDate() - daysAgo);

        const hour = gaussianHour();
        clickDate.setHours(hour, faker.number.int({ min: 0, max: 59 }), 0, 0);

        const source = weightedRandom(TRAFFIC_SOURCES) as { source: string };
        const country = faker.helpers.arrayElement(COUNTRIES);
        const device = faker.helpers.arrayElement(DEVICES);
        // Weight links by position (first links get more clicks)
        const linkIndex = Math.floor(Math.pow(Math.random(), 1.5) * linkIds.length);
        const linkId = linkIds[Math.min(linkIndex, linkIds.length - 1)];

        clickEvents.push([
          tenantId, linkId,
          clickDate.toISOString(), hour, clickDate.getDay(),
          source.source, country, device,
        ]);
      }

      // Batch insert click events in chunks of 500
      const chunkSize = 500;
      for (let chunkStart = 0; chunkStart < clickEvents.length; chunkStart += chunkSize) {
        const chunk = clickEvents.slice(chunkStart, chunkStart + chunkSize);
        const valuesClauses = chunk.map(
          (_, idx) =>
            `($${idx * 8 + 1}, $${idx * 8 + 2}, $${idx * 8 + 3}, $${idx * 8 + 4}, $${idx * 8 + 5}, $${idx * 8 + 6}, $${idx * 8 + 7}, $${idx * 8 + 8})`
        );
        const flatValues = chunk.flat();
        await client.query(
          `INSERT INTO click_events (tenant_id, link_id, clicked_at, hour_of_day, day_of_week, traffic_source, country, device)
           VALUES ${valuesClauses.join(', ')}`,
          flatValues
        );
      }

      console.log(`   ✅ Tenant seeded successfully`);
    }

    await client.query('COMMIT');
    console.log('\n🎉 Seed complete! Demo accounts:');
    TENANTS.forEach(t => {
      console.log(`   ${t.email} / ${t.password}  →  /t/${t.slug}`);
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
