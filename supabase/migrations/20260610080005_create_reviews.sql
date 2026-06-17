-- =============================================================
-- Migration: 20260610080005_create_reviews.sql
-- Domain 9: Review & Rating
-- =============================================================

-- -------------------------------------------------------
-- Table: product_reviews
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(150),
  body TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT true,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'hidden')
  ),
  helpful_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE product_reviews IS 'Customer product reviews (1 per order_item)';

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at DESC);

-- -------------------------------------------------------
-- Table: review_media
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS review_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  sort_order INT NOT NULL DEFAULT 0
);

COMMENT ON TABLE review_media IS 'Photos and videos attached to product reviews';

CREATE INDEX IF NOT EXISTS idx_review_media_review_id ON review_media(review_id);

-- -------------------------------------------------------
-- Table: review_replies (1 admin reply per review)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS review_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE UNIQUE,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE review_replies IS 'Admin replies to product reviews (max 1 per review)';

-- -------------------------------------------------------
-- Table: product_rating_summary
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_rating_summary (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_reviews INT NOT NULL DEFAULT 0,
  rating_1_count INT NOT NULL DEFAULT 0,
  rating_2_count INT NOT NULL DEFAULT 0,
  rating_3_count INT NOT NULL DEFAULT 0,
  rating_4_count INT NOT NULL DEFAULT 0,
  rating_5_count INT NOT NULL DEFAULT 0,
  with_media_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE product_rating_summary IS 'Aggregated rating summary per product (maintained by trigger)';

-- -------------------------------------------------------
-- Trigger: recalculate_rating_summary
-- Recalculates product_rating_summary on review changes
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_rating_summary()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
BEGIN
  -- Get the product_id from either NEW or OLD
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);

  -- Upsert the rating summary
  INSERT INTO product_rating_summary (
    product_id, avg_rating, total_reviews,
    rating_1_count, rating_2_count, rating_3_count,
    rating_4_count, rating_5_count, with_media_count, updated_at
  )
  SELECT
    v_product_id,
    COALESCE(AVG(r.rating), 0),
    COUNT(r.id),
    COUNT(r.id) FILTER (WHERE r.rating = 1),
    COUNT(r.id) FILTER (WHERE r.rating = 2),
    COUNT(r.id) FILTER (WHERE r.rating = 3),
    COUNT(r.id) FILTER (WHERE r.rating = 4),
    COUNT(r.id) FILTER (WHERE r.rating = 5),
    COUNT(DISTINCT r.id) FILTER (WHERE EXISTS (
      SELECT 1 FROM review_media rm WHERE rm.review_id = r.id
    )),
    now()
  FROM product_reviews r
  WHERE r.product_id = v_product_id
    AND r.status = 'approved'
  ON CONFLICT (product_id)
  DO UPDATE SET
    avg_rating = EXCLUDED.avg_rating,
    total_reviews = EXCLUDED.total_reviews,
    rating_1_count = EXCLUDED.rating_1_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_5_count = EXCLUDED.rating_5_count,
    with_media_count = EXCLUDED.with_media_count,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recalculate_rating ON product_reviews;
CREATE TRIGGER trg_recalculate_rating
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_rating_summary();
