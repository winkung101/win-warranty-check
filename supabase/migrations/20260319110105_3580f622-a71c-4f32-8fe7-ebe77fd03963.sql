ALTER TABLE public.customers
  ADD COLUMN last_check_device text,
  ADD COLUMN last_check_os text,
  ADD COLUMN last_check_browser text,
  ADD COLUMN last_check_screen text,
  ADD COLUMN last_check_at timestamp with time zone;