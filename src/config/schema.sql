CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password TEXT, -- NULL if social login only

  -- Role
  role VARCHAR(20) DEFAULT 'homeowner',
  -- homeowner | professional | admin

  -- Profile
  avatar_url TEXT,
  phone VARCHAR(20),

  -- Location
  location TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Verification & Security
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_blocked BOOLEAN DEFAULT FALSE,
  is_onboarded BOOLEAN DEFAULT FALSE;

  -- Tracking
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  provider VARCHAR(50) NOT NULL, -- google, facebook, apple
  provider_id TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(provider, provider_id)
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

CREATE TABLE profiles (
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

CREATE TABLE profile_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  category VARCHAR(100) NOT NULL,
  provider_name TEXT NOT NULL,
  google_place_id TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);