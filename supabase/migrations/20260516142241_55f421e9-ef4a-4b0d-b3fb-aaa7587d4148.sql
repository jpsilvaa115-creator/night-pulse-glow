
-- ============ NIGHTS / DRINKS / VENUES ============
CREATE TABLE public.nights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Minha noite',
  city TEXT NOT NULL DEFAULT '',
  neighborhood TEXT NOT NULL DEFAULT '',
  vibe TEXT NOT NULL DEFAULT 'social' CHECK (vibe IN ('chill','social','lendaria','after')),
  hydration_ml INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  photo_url TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX nights_user_id_idx ON public.nights(user_id);
CREATE INDEX nights_created_at_idx ON public.nights(created_at DESC);

ALTER TABLE public.nights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nights are viewable by everyone"
  ON public.nights FOR SELECT USING (true);
CREATE POLICY "Users can insert their own nights"
  ON public.nights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own nights"
  ON public.nights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own nights"
  ON public.nights FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER nights_touch_updated_at
  BEFORE UPDATE ON public.nights
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Drinks
CREATE TABLE public.drinks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  night_id UUID NOT NULL REFERENCES public.nights(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount_ml INTEGER NOT NULL DEFAULT 0,
  abv NUMERIC(4,3) NOT NULL DEFAULT 0,
  time TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX drinks_night_id_idx ON public.drinks(night_id);
ALTER TABLE public.drinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drinks are viewable by everyone"
  ON public.drinks FOR SELECT USING (true);
CREATE POLICY "Users can insert drinks in their own nights"
  ON public.drinks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.nights n WHERE n.id = night_id AND n.user_id = auth.uid())
  );
CREATE POLICY "Users can update drinks in their own nights"
  ON public.drinks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.nights n WHERE n.id = night_id AND n.user_id = auth.uid())
  );
CREATE POLICY "Users can delete drinks in their own nights"
  ON public.drinks FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.nights n WHERE n.id = night_id AND n.user_id = auth.uid())
  );

-- Venues
CREATE TABLE public.night_venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  night_id UUID NOT NULL REFERENCES public.nights(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  time TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX night_venues_night_id_idx ON public.night_venues(night_id);
ALTER TABLE public.night_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venues are viewable by everyone"
  ON public.night_venues FOR SELECT USING (true);
CREATE POLICY "Users can insert venues in their own nights"
  ON public.night_venues FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.nights n WHERE n.id = night_id AND n.user_id = auth.uid())
  );
CREATE POLICY "Users can update venues in their own nights"
  ON public.night_venues FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.nights n WHERE n.id = night_id AND n.user_id = auth.uid())
  );
CREATE POLICY "Users can delete venues in their own nights"
  ON public.night_venues FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.nights n WHERE n.id = night_id AND n.user_id = auth.uid())
  );

-- ============ STORAGE: night-photos bucket (public) ============
INSERT INTO storage.buckets (id, name, public)
  VALUES ('night-photos', 'night-photos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Night photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'night-photos');

CREATE POLICY "Users can upload their own night photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'night-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own night photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'night-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own night photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'night-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
