-- Drop the unused shared_sessions table to eliminate unnecessary attack surface
-- The table has overly permissive RLS policies (public INSERT/SELECT) but is never used in the application
DROP TABLE IF EXISTS public.shared_sessions;