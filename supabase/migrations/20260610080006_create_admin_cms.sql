-- =============================================================
-- Migration: 20260610080006_create_admin_cms.sql
-- Domain 10: Admin Panel & CMS
-- =============================================================

-- -------------------------------------------------------
-- Table: banners
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(150) NOT NULL,
  subtitle VARCHAR(255),
  image_url VARCHAR(500) NOT NULL,
  image_mobile_url VARCHAR(500),
  link_url VARCHAR(500),
  position VARCHAR(50) NOT NULL DEFAULT 'homepage_hero' CHECK (
    position IN ('homepage_hero', 'mid_banner', 'category_banner', 'promo_banner')
  ),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE banners IS 'Site banners for homepage hero, mid-page, etc.';

CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);

-- -------------------------------------------------------
-- Table: landing_pages
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  meta_title VARCHAR(255),
  meta_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE landing_pages IS 'Dynamic CMS landing pages with JSON content';

CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);

DROP TRIGGER IF EXISTS trg_landing_pages_updated_at ON landing_pages;
CREATE TRIGGER trg_landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- -------------------------------------------------------
-- Table: redirects
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS redirects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_path VARCHAR(500) NOT NULL,
  to_path VARCHAR(500) NOT NULL,
  status_code INT NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE redirects IS 'URL redirects managed via admin panel (used by Next.js middleware)';

CREATE INDEX IF NOT EXISTS idx_redirects_from_path ON redirects(from_path);
CREATE INDEX IF NOT EXISTS idx_redirects_is_active ON redirects(is_active);

-- -------------------------------------------------------
-- Table: site_settings
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (
    type IN ('text', 'json', 'boolean', 'image', 'number')
  ),
  "group" VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (
    "group" IN ('general', 'seo', 'payment', 'social', 'shipping', 'email')
  ),
  label VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE site_settings IS 'Key-value store for site-wide settings';

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- -------------------------------------------------------
-- Table: admin_activity_logs
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100),
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE admin_activity_logs IS 'Audit trail of all admin actions';

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_resource ON admin_activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);
