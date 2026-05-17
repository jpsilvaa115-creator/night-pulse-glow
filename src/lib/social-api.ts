// Social layer: profiles, friendships, likes, comments, notifications.
// All RLS-enforced on the server. Uses the browser supabase client.
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string;
  bio: string;
  city?: string;
  photo_url?: string;
};

export type FriendshipStatus = "self" | "friends" | "outgoing" | "incoming" | "none";

export type CommentRow = {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  profile?: Profile;
};

export type NotificationRow = {
  id: string;
  type: "like" | "comment" | "friend_request" | "friend_accept";
  actor_id: string | null;
  night_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile;
};

// ============== Profiles ==============
export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, bio, city, photo_url")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, bio, city, photo_url")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return [];
  return (data ?? []) as Profile[];
}

export async function fetchProfilesByIds(ids: string[]): Promise<Map<string, Profile>> {
  const out = new Map<string, Profile>();
  if (!ids.length) return out;
  const unique = Array.from(new Set(ids));
  const { data } = await supabase
    .from("profiles")
    .select("id, username, bio, city, photo_url")
    .in("id", unique);
  for (const p of (data ?? []) as Profile[]) out.set(p.id, p);
  return out;
}

export async function searchProfiles(q: string): Promise<Profile[]> {
  const t = q.trim();
  if (!t) return [];
  const like = `%${t}%`;
  const { data } = await supabase
    .from("profiles")
    .select("id, username, bio, city, photo_url")
    .or(`username.ilike.${like},bio.ilike.${like}`)
    .limit(20);
  return (data ?? []) as Profile[];
}

// ============== Friendships ==============
type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
};

async function loadMyFriendships(meId: string): Promise<FriendshipRow[]> {
  const { data } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(`requester_id.eq.${meId},addressee_id.eq.${meId}`);
  return (data ?? []) as FriendshipRow[];
}

export async function fetchFriendshipMap(
  meId: string,
): Promise<Map<string, FriendshipStatus>> {
  const out = new Map<string, FriendshipStatus>();
  const rows = await loadMyFriendships(meId);
  for (const r of rows) {
    const other = r.requester_id === meId ? r.addressee_id : r.requester_id;
    if (r.status === "accepted") out.set(other, "friends");
    else if (r.requester_id === meId) out.set(other, "outgoing");
    else out.set(other, "incoming");
  }
  return out;
}

export async function fetchFriends(meId: string): Promise<Profile[]> {
  const rows = await loadMyFriendships(meId);
  const ids = rows
    .filter((r) => r.status === "accepted")
    .map((r) => (r.requester_id === meId ? r.addressee_id : r.requester_id));
  const map = await fetchProfilesByIds(ids);
  return ids.map((id) => map.get(id)).filter(Boolean) as Profile[];
}

export async function fetchIncomingRequests(meId: string): Promise<Profile[]> {
  const rows = await loadMyFriendships(meId);
  const ids = rows
    .filter((r) => r.status === "pending" && r.addressee_id === meId)
    .map((r) => r.requester_id);
  const map = await fetchProfilesByIds(ids);
  return ids.map((id) => map.get(id)).filter(Boolean) as Profile[];
}

export async function fetchOutgoingRequests(meId: string): Promise<Profile[]> {
  const rows = await loadMyFriendships(meId);
  const ids = rows
    .filter((r) => r.status === "pending" && r.requester_id === meId)
    .map((r) => r.addressee_id);
  const map = await fetchProfilesByIds(ids);
  return ids.map((id) => map.get(id)).filter(Boolean) as Profile[];
}

export async function sendFriendRequest(meId: string, otherId: string) {
  await supabase
    .from("friendships")
    .insert({ requester_id: meId, addressee_id: otherId, status: "pending" });
}

export async function cancelFriendRequest(meId: string, otherId: string) {
  await supabase
    .from("friendships")
    .delete()
    .eq("requester_id", meId)
    .eq("addressee_id", otherId);
}

export async function acceptFriendRequest(meId: string, otherId: string) {
  await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("requester_id", otherId)
    .eq("addressee_id", meId);
}

export async function declineFriendRequest(meId: string, otherId: string) {
  await supabase
    .from("friendships")
    .delete()
    .eq("requester_id", otherId)
    .eq("addressee_id", meId);
}

export async function removeFriend(meId: string, otherId: string) {
  await supabase
    .from("friendships")
    .delete()
    .or(
      `and(requester_id.eq.${meId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${meId})`,
    );
}

// ============== Likes ==============
export async function fetchMyLikedNightIds(meId: string): Promise<Set<string>> {
  const { data } = await supabase.from("likes").select("night_id").eq("user_id", meId);
  return new Set((data ?? []).map((r) => r.night_id as string));
}

export async function toggleLike(
  meId: string,
  nightId: string,
  currentlyLiked: boolean,
): Promise<boolean> {
  if (currentlyLiked) {
    await supabase.from("likes").delete().eq("user_id", meId).eq("night_id", nightId);
    return false;
  }
  const { error } = await supabase
    .from("likes")
    .insert({ user_id: meId, night_id: nightId });
  if (error && error.code !== "23505") {
    console.error("toggleLike", error);
    return currentlyLiked;
  }
  return true;
}

// ============== Comments ==============
export async function fetchComments(nightId: string): Promise<CommentRow[]> {
  const { data } = await supabase
    .from("comments")
    .select("id, user_id, text, created_at")
    .eq("night_id", nightId)
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as CommentRow[];
  const profiles = await fetchProfilesByIds(rows.map((r) => r.user_id));
  return rows.map((r) => ({ ...r, profile: profiles.get(r.user_id) }));
}

export async function addComment(
  meId: string,
  nightId: string,
  text: string,
): Promise<CommentRow | null> {
  const clean = text.trim().slice(0, 500);
  if (!clean) return null;
  const { data, error } = await supabase
    .from("comments")
    .insert({ user_id: meId, night_id: nightId, text: clean })
    .select("id, user_id, text, created_at")
    .single();
  if (error || !data) return null;
  const profile = await fetchProfile(meId);
  return { ...(data as CommentRow), profile: profile ?? undefined };
}

export async function deleteComment(commentId: string) {
  await supabase.from("comments").delete().eq("id", commentId);
}

// ============== Notifications ==============
export async function fetchNotifications(meId: string): Promise<NotificationRow[]> {
  const { data } = await supabase
    .from("notifications")
    .select("id, type, actor_id, night_id, comment_id, read, created_at")
    .eq("user_id", meId)
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as NotificationRow[];
  const ids = rows.map((r) => r.actor_id).filter(Boolean) as string[];
  const profiles = await fetchProfilesByIds(ids);
  return rows.map((r) => ({ ...r, actor: r.actor_id ? profiles.get(r.actor_id) : undefined }));
}

export async function unreadNotificationsCount(meId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", meId)
    .eq("read", false);
  return count ?? 0;
}

export async function markAllNotificationsRead(meId: string) {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", meId)
    .eq("read", false);
}
