
-- Announcements table for admin announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'urgent')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can read active announcements
CREATE POLICY "Anyone can read active announcements"
  ON public.announcements FOR SELECT TO public
  USING (is_active = true);

-- Only authenticated users (admin) can manage announcements
CREATE POLICY "Admin can insert announcements"
  ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update announcements"
  ON public.announcements FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Admin can delete announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (true);

-- Admin can read all announcements (including inactive)
CREATE POLICY "Admin can read all announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (true);

-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imei text NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (public page)
CREATE POLICY "Anyone can insert push subscription"
  ON public.push_subscriptions FOR INSERT TO public
  WITH CHECK (true);

-- Anyone can read their own subscription by endpoint
CREATE POLICY "Anyone can read push subscriptions"
  ON public.push_subscriptions FOR SELECT TO public
  USING (true);

-- Admin can manage all subscriptions
CREATE POLICY "Admin can delete push subscriptions"
  ON public.push_subscriptions FOR DELETE TO authenticated
  USING (true);
