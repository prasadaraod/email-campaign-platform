CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tenants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  email       TEXT NOT NULL,
  name        TEXT,
  metadata    JSONB DEFAULT '{}',
  subscribed  BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, email)
);

CREATE TABLE campaigns (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID REFERENCES tenants(id),
  name         TEXT NOT NULL,
  subject      TEXT NOT NULL,
  body_html    TEXT,
  status       TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sends (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  contact_id  UUID REFERENCES contacts(id),
  status      TEXT DEFAULT 'queued',
  sent_at     TIMESTAMPTZ
);

CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  send_id     UUID REFERENCES sends(id),
  type        TEXT,
  occurred_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contacts_tenant ON contacts(tenant_id) WHERE subscribed = TRUE;
CREATE INDEX idx_campaigns_status ON campaigns(status);