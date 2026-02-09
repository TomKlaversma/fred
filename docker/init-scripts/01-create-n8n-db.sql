-- Create a separate database for N8N
-- This runs on first PostgreSQL startup only

SELECT 'CREATE DATABASE fred_n8n'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fred_n8n')\gexec
