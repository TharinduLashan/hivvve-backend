CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  email VARCHAR(150) NOT NULL,
  password TEXT,

  role VARCHAR(20) DEFAULT 'homeowner',

  avatar_url TEXT,
  phone VARCHAR(20),

  location TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  is_email_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,

  is_active BOOLEAN DEFAULT TRUE,
  is_blocked BOOLEAN DEFAULT FALSE,
  is_onboarded BOOLEAN DEFAULT FALSE,

  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Case-insensitive unique index
CREATE UNIQUE INDEX users_email_unique_idx
ON users (LOWER(email));

CREATE TABLE user_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  provider VARCHAR(20) NOT NULL,
  provider_user_id TEXT NOT NULL,

  provider_email TEXT,
  provider_data JSONB,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(provider, provider_user_id),
  UNIQUE(user_id, provider)
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- optional security
  user_agent TEXT,
  ip_address TEXT,

  is_revoked BOOLEAN DEFAULT FALSE
);

CREATE TABLE profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Name
  first_name VARCHAR(100),
  last_name VARCHAR(100),

  -- Location
  zip_code VARCHAR(10),
  city VARCHAR(100),
  county VARCHAR(100),
  state VARCHAR(100),

  -- Status
  is_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL
);

ALTER TABLE users ADD COLUMN service_id UUID REFERENCES services(id);

CREATE TABLE user_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,

  UNIQUE(user_id, service_id)
);

CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  place_id TEXT, -- Google Places ID
  service_id UUID REFERENCES services(id)
);

CREATE TABLE homeowner_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  homeowner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,

  service_id UUID REFERENCES services(id),

  endorsement TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE professional_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  business_name TEXT,
  service_id UUID REFERENCES services(id),
  description TEXT,
  website TEXT,
  logo_url TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE professional_service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID REFERENCES users(id) ON DELETE CASCADE,

  zip_code VARCHAR(10)
);