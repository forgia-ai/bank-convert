-- Migration: 001_initial_setup.sql
-- Description: Initial database setup with required extensions
-- Created: 2024-01-01

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security by default for new tables
-- This will be applied to specific tables in subsequent migrations 