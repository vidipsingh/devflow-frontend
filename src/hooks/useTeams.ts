
"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/apiFetch";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  slug: string;
  description: string;
  bio: string;
  avatar: string;
  banner: string;
  tags: string[];
  type: string;
  visibility: string;
  joinPolicy: string;
  parentId?: string;
  memberCount: number;
  repoCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  username: string;
  avatar: string;
  role: string;
  isBanned: boolean;
  joinedAt: string;
  updatedAt: string;
}

export interface TeamInvite {
  id: string;
  teamId: string;
  teamName: string;
  teamSlug: string;
  invitedBy: string;
  inviterName: string;
  inviteeId?: string;
  inviteeEmail?: string;
  token?: string;       // returned by ListMyInvites so the invitee can accept/decline
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamJoinRequest {
  id: string;
  teamId: string;
  userId: string;
  username: string;
  avatar: string;
  message: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  bio?: string;
  type?: string;
  visibility?: string;
  joinPolicy?: string;
  tags?: string[];
  parentId?: string;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  visibility?: string;
  joinPolicy?: string;
  tags?: string[];
}

// ─── Phase 2 Types ────────────────────────────────────────────────────────────

export interface TeamRepo {
  id: string;
  teamId: string;
  repoId: string;
  repoName: string;
  repoSlug: string;
  repoFullName: string; // e.g. "owner/repo-name" — use for /dashboard/repositories/:fullName
  visibility: string;
  addedBy: string;
  addedAt: string;
}

export interface TeamActivity {
  id: string;
  teamId: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  action: string;
  targetType: string;
  targetName: string;
  meta?: Record<string, string>;
  createdAt: string;
}

export interface TeamAuditLog {
  id: string;
  teamId: string;
  actorId: string;
  actorUsername: string;
  action: string;
  targetUsername?: string;
  targetRole?: string;
  meta?: Record<string, string>;
  createdAt: string;
}

export interface TeamPermissions {
  role: string;
  permissions: string[];
}

export interface CreateSubTeamPayload {
  name: string;
  description?: string;
  visibility?: string;
  joinPolicy?: string;
  tags?: string[];
}



// ─── API helpers ──────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  data: T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch<ApiResponse<T>>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch<ApiResponse<T>>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return res.data;
}

async function apiDelete<T>(path: string): Promise<T> {
  const res = await apiFetch<ApiResponse<T>>(path, { method: "DELETE" });
  return res.data;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch<ApiResponse<T>>(path);
  return res.data;
}

// ─── Teams CRUD ───────────────────────────────────────────────────────────────

export async function createTeam(payload: CreateTeamPayload): Promise<Team> {
  return apiPost<Team>("/api/v1/teams", payload);
}

export async function getTeam(slug: string): Promise<Team> {
  return apiGet<Team>(`/api/v1/teams/${slug}`);
}

export async function updateTeam(slug: string, payload: UpdateTeamPayload): Promise<Team> {
  return apiPatch<Team>(`/api/v1/teams/${slug}`, payload);
}

export async function deleteTeam(slug: string): Promise<void> {
  await apiDelete(`/api/v1/teams/${slug}`);
}

export async function listPublicTeams(search = "", limit = 20, skip = 0): Promise<Team[]> {
  const res = await apiFetch<ApiResponse<Team[]>>(
    `/api/v1/teams/discover?q=${encodeURIComponent(search)}&limit=${limit}&skip=${skip}`
  );
  return res.data ?? [];
}

export async function listSubTeams(slug: string): Promise<Team[]> {
  const res = await apiFetch<ApiResponse<Team[]>>(`/api/v1/teams/${slug}/sub-teams`);
  return res.data ?? [];
}

// ─── Members ──────────────────────────────────────────────────────────────────

// Returns the caller's own pending join request for this team, or null if none
export async function getMyJoinRequest(slug: string): Promise<TeamJoinRequest | null> {
  try {
    const res = await apiFetch<{ data: TeamJoinRequest | null }>(`/api/v1/teams/${slug}/join-requests/me`);
    return res.data ?? null;
  } catch {
    return null;
  }
}

// Returns the caller's own membership record for this team, or null if not a member
export async function getMyMembership(slug: string): Promise<TeamMember | null> {
  try {
    const res = await apiFetch<{ data: TeamMember | null }>(`/api/v1/teams/${slug}/members/me`);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function listTeamMembers(slug: string, role = "", limit = 50, skip = 0): Promise<TeamMember[]> {
  const params = new URLSearchParams({ limit: String(limit), skip: String(skip) });
  if (role) params.set("role", role);
  const res = await apiFetch<ApiResponse<TeamMember[]>>(`/api/v1/teams/${slug}/members?${params}`);
  return res.data ?? [];
}

export async function updateMemberRole(slug: string, username: string, role: string): Promise<void> {
  await apiPatch(`/api/v1/teams/${slug}/members/${username}/role`, { role });
}

export async function removeMember(slug: string, username: string): Promise<void> {
  await apiDelete(`/api/v1/teams/${slug}/members/${username}`);
}

export async function banMember(slug: string, username: string, ban: boolean): Promise<void> {
  await apiPatch(`/api/v1/teams/${slug}/members/${username}/ban`, { ban });
}

export async function leaveTeam(slug: string): Promise<void> {
  await apiPost(`/api/v1/teams/${slug}/leave`, {});
}

export async function transferOwnership(slug: string, username: string): Promise<void> {
  await apiPost(`/api/v1/teams/${slug}/transfer`, { username });
}

// ─── Invites ──────────────────────────────────────────────────────────────────

export async function inviteMember(slug: string, username: string, email: string, role: string): Promise<TeamInvite> {
  return apiPost<TeamInvite>(`/api/v1/teams/${slug}/invites`, { username, email, role });
}

export async function listPendingInvites(slug: string): Promise<TeamInvite[]> {
  const res = await apiFetch<ApiResponse<TeamInvite[]>>(`/api/v1/teams/${slug}/invites`);
  return res.data ?? [];
}

export async function revokeInvite(slug: string, inviteId: string): Promise<void> {
  await apiDelete(`/api/v1/teams/${slug}/invites/${inviteId}`);
}

export async function listMyInvites(): Promise<TeamInvite[]> {
  const res = await apiFetch<ApiResponse<TeamInvite[]>>("/api/v1/teams/invites/me");
  return res.data ?? [];
}

export async function acceptInvite(token: string): Promise<Team> {
  return apiPost<Team>(`/api/v1/teams/invites/${token}/accept`, {});
}

export async function declineInvite(token: string): Promise<void> {
  await apiPost(`/api/v1/teams/invites/${token}/decline`, {});
}

// ─── Join Requests ────────────────────────────────────────────────────────────

export async function requestToJoin(slug: string, message = ""): Promise<TeamJoinRequest | { joined: boolean }> {
  return apiPost(`/api/v1/teams/${slug}/join-requests`, { message });
}

export async function listJoinRequests(slug: string): Promise<TeamJoinRequest[]> {
  const res = await apiFetch<ApiResponse<TeamJoinRequest[]>>(`/api/v1/teams/${slug}/join-requests`);
  return res.data ?? [];
}

export async function reviewJoinRequest(slug: string, requestId: string, action: "approve" | "reject"): Promise<void> {
  await apiPatch(`/api/v1/teams/${slug}/join-requests/${requestId}`, { action });
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useMyTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<ApiResponse<Team[]>>("/api/v1/teams");
      setTeams(res.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { teams, loading, error, reload: load };
}

export function useTeam(slug: string) {
  const [team, setTeam] = useState<Team | null>(null);
  const [myMembership, setMyMembership] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const [t, members] = await Promise.all([
        getTeam(slug),
        listTeamMembers(slug, "", 100, 0).catch(() => [] as TeamMember[]),
      ]);
      setTeam(t);
      // Find caller's own membership — we don't have callerID here so we leave
      // the discovery to the page via username from auth context.
      setMyMembership(members[0] ?? null); // placeholder; page overrides
      // Expose full members via a separate key isn't needed — pages call listTeamMembers directly
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);
  return { team, myMembership, loading, error, reload: load };
}

export function useDiscoverTeams(initialSearch = "") {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await listPublicTeams(q, 24, 0);
      setTeams(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(search); }, [search, load]);
  return { teams, search, setSearch, loading, error, reload: () => load(search) };
}

export function useMyInvites() {
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listMyInvites();
      setInvites(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load invites");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { invites, loading, error, reload: load };
}


// ─── Phase 2: Team Repos ──────────────────────────────────────────────────────

export async function listTeamRepos(slug: string, limit = 50, skip = 0): Promise<TeamRepo[]> {
  const res = await apiFetch<ApiResponse<TeamRepo[]>>(
    `/api/v1/teams/${slug}/repos?limit=${limit}&skip=${skip}`
  );
  return res.data ?? [];
}

export async function addTeamRepo(slug: string, repoName: string): Promise<TeamRepo> {
  return apiPost<TeamRepo>(`/api/v1/teams/${slug}/repos`, { repoName });
}

export async function removeTeamRepo(slug: string, repoSlug: string): Promise<void> {
  await apiDelete(`/api/v1/teams/${slug}/repos/${repoSlug}`);
}

// ─── Phase 2: Activity Feed ───────────────────────────────────────────────────

export async function listTeamActivity(slug: string, limit = 30, skip = 0): Promise<TeamActivity[]> {
  const res = await apiFetch<ApiResponse<TeamActivity[]>>(
    `/api/v1/teams/${slug}/activity?limit=${limit}&skip=${skip}`
  );
  return res.data ?? [];
}

// ─── Phase 2: Audit Log ───────────────────────────────────────────────────────

export async function listTeamAuditLog(slug: string, limit = 50, skip = 0): Promise<TeamAuditLog[]> {
  const res = await apiFetch<ApiResponse<TeamAuditLog[]>>(
    `/api/v1/teams/${slug}/audit-log?limit=${limit}&skip=${skip}`
  );
  return res.data ?? [];
}

// ─── Phase 2: Permissions ─────────────────────────────────────────────────────

export async function getMyPermissions(slug: string): Promise<TeamPermissions | null> {
  try {
    const res = await apiFetch<ApiResponse<TeamPermissions>>(`/api/v1/teams/${slug}/permissions/me`);
    return res.data ?? null;
  } catch {
    return null;
  }
}

// ─── Phase 2: Sub-teams ───────────────────────────────────────────────────────

export async function createSubTeam(parentSlug: string, payload: CreateSubTeamPayload): Promise<Team> {
  return apiPost<Team>(`/api/v1/teams/${parentSlug}/sub-teams`, payload);
}


// ─── Phase 3: Discussions ─────────────────────────────────────────────────────

export interface TeamDiscussion {
  id: string;
  teamId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  body: string;
  pinned: boolean;
  resolved: boolean;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamDiscussionReply {
  id: string;
  discussionId: string;
  teamId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export async function listDiscussions(slug: string, limit = 30, skip = 0): Promise<TeamDiscussion[]> {
  const res = await apiFetch<ApiResponse<TeamDiscussion[]>>(
    `/api/v1/teams/${slug}/discussions?limit=${limit}&skip=${skip}`
  );
  return res.data ?? [];
}

export async function createDiscussion(slug: string, title: string, body: string): Promise<TeamDiscussion> {
  return apiPost<TeamDiscussion>(`/api/v1/teams/${slug}/discussions`, { title, body });
}

export async function getDiscussion(slug: string, discussionId: string): Promise<{ discussion: TeamDiscussion; replies: TeamDiscussionReply[] }> {
  const res = await apiFetch<ApiResponse<{ discussion: TeamDiscussion; replies: TeamDiscussionReply[] }>>(
    `/api/v1/teams/${slug}/discussions/${discussionId}`
  );
  return res.data;
}

export async function updateDiscussion(slug: string, discussionId: string, title: string, body: string): Promise<TeamDiscussion> {
  return apiPatch<TeamDiscussion>(`/api/v1/teams/${slug}/discussions/${discussionId}`, { title, body });
}

export async function pinDiscussion(slug: string, discussionId: string, pinned: boolean): Promise<void> {
  await apiPatch(`/api/v1/teams/${slug}/discussions/${discussionId}/pin`, { pinned });
}

export async function resolveDiscussion(slug: string, discussionId: string, resolved: boolean): Promise<void> {
  await apiPatch(`/api/v1/teams/${slug}/discussions/${discussionId}/resolve`, { resolved });
}

export async function deleteDiscussion(slug: string, discussionId: string): Promise<void> {
  await apiDelete(`/api/v1/teams/${slug}/discussions/${discussionId}`);
}

export async function addReply(slug: string, discussionId: string, body: string): Promise<TeamDiscussionReply> {
  return apiPost<TeamDiscussionReply>(`/api/v1/teams/${slug}/discussions/${discussionId}/replies`, { body });
}

export async function deleteReply(slug: string, discussionId: string, replyId: string): Promise<void> {
  await apiDelete(`/api/v1/teams/${slug}/discussions/${discussionId}/replies/${replyId}`);
}
