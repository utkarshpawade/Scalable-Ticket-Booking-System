-- Bootstrapped on first Postgres container start.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- USERS
-- ============================================================
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS citext;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          VARCHAR(255) UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(120) NOT NULL,
  phone          VARCHAR(20),
  role           VARCHAR(20) NOT NULL DEFAULT 'customer'
                 CHECK (role IN ('customer','admin','partner')),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- BOOKINGS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM (
      'PENDING','SEATS_LOCKED','PAYMENT_PROCESSING',
      'CONFIRMED','FAILED','CANCELLED','EXPIRED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  showtime_id     VARCHAR(64) NOT NULL,
  seat_ids        TEXT[] NOT NULL,
  total_amount    NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  status          booking_status NOT NULL DEFAULT 'PENDING',
  saga_state      JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  payment_ref     VARCHAR(128),
  lock_token      VARCHAR(128),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_showtime    ON bookings(showtime_id);
CREATE INDEX IF NOT EXISTS idx_bookings_expires
  ON bookings(expires_at)
  WHERE status IN ('PENDING','SEATS_LOCKED','PAYMENT_PROCESSING');

-- ============================================================
-- SAGA COMPENSATION DEAD-LETTER
-- ============================================================
CREATE TABLE IF NOT EXISTS saga_compensation_failures (
  id          BIGSERIAL PRIMARY KEY,
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  step        VARCHAR(40) NOT NULL,
  error       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saga_comp_booking ON saga_compensation_failures(booking_id);

-- ============================================================
-- TRANSACTIONAL OUTBOX
-- ============================================================
CREATE TABLE IF NOT EXISTS outbox (
  id             BIGSERIAL PRIMARY KEY,
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id   UUID NOT NULL,
  event_type     VARCHAR(80) NOT NULL,
  payload        JSONB NOT NULL,
  headers        JSONB NOT NULL DEFAULT '{}'::jsonb,
  status         VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                 CHECK (status IN ('PENDING','PUBLISHED','FAILED')),
  attempts       INT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbox_due
  ON outbox(status, next_attempt_at)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_outbox_aggregate
  ON outbox(aggregate_type, aggregate_id);

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated    ON users;
DROP TRIGGER IF EXISTS trg_bookings_updated ON bookings;

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_bookings_updated
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Seed admin (dev only)
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@ticket.local',
        '$2b$10$PLACEHOLDER_BCRYPT_HASH_REPLACE_IN_BOOT_SCRIPT',
        'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;
