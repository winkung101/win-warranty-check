CREATE OR REPLACE FUNCTION public.record_device_check(
  _imei text,
  _device text,
  _os text,
  _browser text,
  _screen text
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
      last_check_at = now()
  WHERE imei = _imei;
END;
$$;