
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  bio TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  birth_year INTEGER NOT NULL,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  CONSTRAINT birth_year_range CHECK (birth_year >= 1900 AND birth_year <= EXTRACT(YEAR FROM now())::int - 18)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are publicly readable (social app)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup using metadata from signUp options.data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_username TEXT;
  v_birth_year INTEGER;
  v_bio TEXT;
  v_city TEXT;
BEGIN
  v_username := COALESCE(meta->>'username', split_part(NEW.email, '@', 1));
  -- sanitize username to satisfy CHECK constraint
  v_username := regexp_replace(v_username, '[^a-zA-Z0-9_]', '_', 'g');
  IF length(v_username) < 3 THEN
    v_username := v_username || '_user';
  END IF;
  IF length(v_username) > 30 THEN
    v_username := substr(v_username, 1, 30);
  END IF;

  -- ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_username := substr(v_username, 1, 25) || substr(md5(random()::text), 1, 4);
  END LOOP;

  v_birth_year := COALESCE((meta->>'birth_year')::int, EXTRACT(YEAR FROM now())::int - 18);
  v_bio := COALESCE(meta->>'bio', '');
  v_city := meta->>'city';

  INSERT INTO public.profiles (id, username, bio, birth_year, city)
  VALUES (NEW.id, v_username, v_bio, v_birth_year, v_city);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
