-- ============================================================
-- LinkHub Database Initialization Script
-- PostgreSQL with Row-Level Security (RLS)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Tenants: one record per platform account / subdomain
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        UNIQUE NOT NULL,
  name        TEXT        NOT NULL,
  bio         TEXT,
  avatar_url  TEXT,
  plan        TEXT        NOT NULL DEFAULT 'free',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users: belong to exactly one tenant (multi-tenant auth)
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'owner',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Links: the bio links for a tenant
CREATE TABLE IF NOT EXISTS links (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  url           TEXT        NOT NULL,
  icon          TEXT,
  description   TEXT,
  position      INT         NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  thumbnail_url TEXT,
  click_count   INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Themes: visual configuration per tenant
CREATE TABLE IF NOT EXISTS themes (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  primary_color       TEXT        NOT NULL DEFAULT '#6C63FF',
  secondary_color     TEXT        NOT NULL DEFAULT '#FF6584',
  background_color    TEXT        NOT NULL DEFAULT '#0f0f0f',
  text_color          TEXT        NOT NULL DEFAULT '#ffffff',
  card_color          TEXT        NOT NULL DEFAULT 'rgba(255,255,255,0.08)',
  font_family         TEXT        NOT NULL DEFAULT 'Inter',
  button_style        TEXT        NOT NULL DEFAULT 'filled',
  button_radius       TEXT        NOT NULL DEFAULT '12px',
  background_type     TEXT        NOT NULL DEFAULT 'solid',
  background_value    TEXT        NOT NULL DEFAULT '#0f0f0f',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Click events: granular analytics per link
CREATE TABLE IF NOT EXISTS click_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  link_id         UUID        NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  clicked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hour_of_day     SMALLINT    NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
  day_of_week     SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  traffic_source  TEXT        NOT NULL DEFAULT 'direct',
  country         TEXT        NOT NULL DEFAULT 'US',
  device          TEXT        NOT NULL DEFAULT 'mobile'
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_links_tenant_position ON links(tenant_id, position);
CREATE INDEX IF NOT EXISTS idx_click_events_tenant ON click_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_click_events_link ON click_events(link_id);
CREATE INDEX IF NOT EXISTS idx_click_events_time ON click_events(tenant_id, clicked_at);
CREATE INDEX IF NOT EXISTS idx_click_events_hour ON click_events(tenant_id, hour_of_day);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on tenant-scoped tables
ALTER TABLE links         ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events  ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies using session variable app.current_tenant_id
-- The backend sets this via: SET LOCAL app.current_tenant_id = '<uuid>'

CREATE POLICY tenant_isolation_links ON links
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_themes ON themes
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_click_events ON click_events
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Allow bypass for seed/admin operations (connect as superuser)
ALTER TABLE links         FORCE ROW LEVEL SECURITY;
ALTER TABLE themes        FORCE ROW LEVEL SECURITY;
ALTER TABLE click_events  FORCE ROW LEVEL SECURITY;

-- Create an application role with limited permissions
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'linkhub_app') THEN
    CREATE ROLE linkhub_app LOGIN PASSWORD 'linkhub_app_pass';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE linkhub_db TO linkhub_app;
GRANT USAGE ON SCHEMA public TO linkhub_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO linkhub_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO linkhub_app;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_links_updated_at
  BEFORE UPDATE ON links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_themes_updated_at
  BEFORE UPDATE ON themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
