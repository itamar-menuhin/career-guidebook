-- Create shared_sessions table for remote session sharing
CREATE TABLE public.shared_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  session_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  version INTEGER NOT NULL DEFAULT 1
);

-- Create index on slug for fast lookups
CREATE INDEX idx_shared_sessions_slug ON public.shared_sessions(slug);

-- Create index on expires_at for cleanup queries
CREATE INDEX idx_shared_sessions_expires_at ON public.shared_sessions(expires_at);

-- Enable Row Level Security
ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read shared sessions (no auth required)
CREATE POLICY "Anyone can read shared sessions"
ON public.shared_sessions
FOR SELECT
USING (true);

-- Allow anyone to insert shared sessions (no auth required)
CREATE POLICY "Anyone can create shared sessions"
ON public.shared_sessions
FOR INSERT
WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_shared_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_shared_sessions_updated_at
BEFORE UPDATE ON public.shared_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_shared_sessions_updated_at();