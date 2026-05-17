REVOKE EXECUTE ON FUNCTION public.handle_like_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_like_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_comment_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_friendship_change() FROM PUBLIC, anon, authenticated;