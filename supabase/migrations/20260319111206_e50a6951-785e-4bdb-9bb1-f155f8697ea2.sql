
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS last_check_details jsonb;

CREATE OR REPLACE FUNCTION public.record_device_check(
  _imei text,
  _device text,
  _os text,
  _browser text,
  _screen text,
  _details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.customers
  SET last_check_device = _device,
      last_check_os = _os,
      last_check_browser = _browser,
      last_check_screen = _screen,
      last_check_at = now(),
      last_check_details = COALESCE(_details, last_check_details)
  WHERE imei = _imei;
END;
$$;
