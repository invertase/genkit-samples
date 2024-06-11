-- Create the extension if it does not exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the films table if it does not exist
CREATE TABLE IF NOT EXISTS films (
  id SERIAL PRIMARY KEY,
  name TEXT,
  description TEXT,
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT now()
);
