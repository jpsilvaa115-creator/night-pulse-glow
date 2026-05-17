-- ============ FRIENDSHIPS ============
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);
CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own friendships"
ON public.friendships FOR SELECT TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users send friend requests"
ON public.friendships FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Involved users update friendship"
ON public.friendships FOR UPDATE TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Involved users delete friendship"
ON public.friendships FOR DELETE TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE TRIGGER friendships_touch_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ LIKES ============
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  night_id UUID NOT NULL REFERENCES public.nights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (night_id, user_id)
);
CREATE INDEX idx_likes_night ON public.likes(night_id);
CREATE INDEX idx_likes_user ON public.likes(user_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes viewable by everyone"
ON public.likes FOR SELECT USING (true);

CREATE POLICY "Users insert their own likes"
ON public.likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own likes"
ON public.likes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============ COMMENTS ============
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  night_id UUID NOT NULL REFERENCES public.nights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_night ON public.comments(night_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by everyone"
ON public.comments FOR SELECT USING (true);

CREATE POLICY "Users insert their own comments"
ON public.comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own comments"
ON public.comments FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like','comment','friend_request','friend_accept')),
  night_id UUID REFERENCES public.nights(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users update their own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users delete their own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============ TRIGGERS: like counter + notifications ============
CREATE OR REPLACE FUNCTION public.handle_like_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id UUID;
BEGIN
  UPDATE public.nights SET likes_count = likes_count + 1 WHERE id = NEW.night_id
  RETURNING user_id INTO owner_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, night_id)
    VALUES (owner_id, NEW.user_id, 'like', NEW.night_id);
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.handle_like_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.nights SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.night_id;
  RETURN OLD;
END $$;

CREATE TRIGGER likes_after_insert AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_like_insert();
CREATE TRIGGER likes_after_delete AFTER DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_like_delete();

CREATE OR REPLACE FUNCTION public.handle_comment_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id UUID;
BEGIN
  SELECT user_id INTO owner_id FROM public.nights WHERE id = NEW.night_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, night_id, comment_id)
    VALUES (owner_id, NEW.user_id, 'comment', NEW.night_id, NEW.id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER comments_after_insert AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.handle_comment_insert();

CREATE OR REPLACE FUNCTION public.handle_friendship_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, actor_id, type)
    VALUES (NEW.addressee_id, NEW.requester_id, 'friend_request');
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, actor_id, type)
    VALUES (NEW.requester_id, NEW.addressee_id, 'friend_accept');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER friendships_after_change AFTER INSERT OR UPDATE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.handle_friendship_change();