
-- Set search_path on touch_updated_at and keep it SECURITY INVOKER (default)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- handle_new_user must remain SECURITY DEFINER (it's called by an auth.users trigger),
-- but it should not be callable directly by API users.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
