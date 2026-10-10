
"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/apiFetch";

// ─── Types matching backend models ────────────────────────────────────────────

export interface CommitSummary {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface FileTreeEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  size: number;
  mimeType: string;
  sha: string;
  lastCommit?: CommitSummary | null;
}

export interface RepoCommit {
  id: string;
  repoId: string;
  branch: string;
  message: string;
  authorName: string;
  shortHash: string;
  filePaths: string[];
  additions: number;
  deletions: number;
  createdAt: string;
}

export interface BlobFile {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  encoding: string;
  sha: string;
  content: string;
}

export interface RepoDetailMeta {
  id: string;        // MongoDB ObjectId hex string
  name: string;
  slug: string;
  fullName: string;
  description: string;
  visibility: "public" | "private";
  defaultBranch: string;
  branches: string[];
  language: string;
  topics: string[];
  stats: {
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
    openPRs: number;
  };
  createdAt: string;
  updatedAt: string;
  // Fork fields (populated by backend when the repo is a fork or has been forked)
  isFork?: boolean;
  forkedFromOwner?: string;   // username of the upstream owner
  forkedFromSlug?: string;    // slug of the upstream repo
  ownerId?: string;           // ObjectId string of the repo owner
  ownerName?: string;         // username of the repo owner
}

export interface UploadFilePayload {
  path: string;       // e.g. "src/main.go"
  content: string;    // base64-encoded
  message?: string;   // commit message
  branch?: string;    // defaults to repo.defaultBranch
}

export interface EditFilePayload {
  path: string;       // e.g. "src/main.go"
  content: string;    // plain-text content
  message?: string;   // commit message
  branch?: string;    // defaults to repo.defaultBranch
}

export interface UseRepoDetailReturn {
  repo: RepoDetailMeta | null;
  tree: FileTreeEntry[];
  commits: RepoCommit[];
  activeBlob: BlobFile | null;
  currentPath: string;
  currentBranch: string;
  isLoadingRepo: boolean;
  isLoadingTree: boolean;
  isLoadingBlob: boolean;
  isUploading: boolean;
  error: string | null;
  uploadError: string | null;
  uploadSuccess: boolean;
  navigateTo: (path: string) => void;
  openBlob: (path: string) => Promise<void>;
  closeBlob: () => void;
  switchBranch: (branch: string) => void;
  uploadFile: (payload: UploadFilePayload) => Promise<boolean>;
  editFile: (payload: EditFilePayload) => Promise<boolean>;
  refetchTree: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

// Convert "owner/repo" to "owner~repo" for the API :name param.
// The backend's ResolveRepo detects "~" and resolves via FindRepoByFullName.
// Plain slugs (no "/") are passed through unchanged for backward-compat.
function encodeSlug(slug: string) {
  return slug.replace("/", "~");
}

export function useRepoDetail(repoSlug: string): UseRepoDetailReturn {
  const [repo, setRepo] = useState<RepoDetailMeta | null>(null);
  const [tree, setTree] = useState<FileTreeEntry[]>([]);
  const [commits, setCommits] = useState<RepoCommit[]>([]);
  const [activeBlob, setActiveBlob] = useState<BlobFile | null>(null);
  const [currentPath, setCurrentPath] = useState(".");
  const [currentBranch, setCurrentBranch] = useState("");

  const [isLoadingRepo, setIsLoadingRepo] = useState(true);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [isLoadingBlob, setIsLoadingBlob] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // ── Fetch repo metadata ──────────────────────────────────────────────────
  const fetchRepo = useCallback(async () => {
    if (!repoSlug) return;
    setIsLoadingRepo(true);
    setError(null);
    try {
      const json = await apiFetch<{ success: boolean; data: RepoDetailMeta }>(
        `/api/v1/repositories/${encodeSlug(repoSlug)}`
      );
      const r = json.data;
      setRepo(r);
      setCurrentBranch(r.defaultBranch ?? "main");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load repository");
    } finally {
      setIsLoadingRepo(false);
    }
  }, [repoSlug]);

  // ── Fetch file tree ──────────────────────────────────────────────────────
  const fetchTree = useCallback(
    async (branch: string, dirPath: string) => {
      if (!repoSlug) return;
      setIsLoadingTree(true);
      try {
        const params = new URLSearchParams({ ref: branch, path: dirPath });
        const json = await apiFetch<{ success: boolean; data: { tree: FileTreeEntry[] } }>(
          `/api/v1/repositories/${encodeSlug(repoSlug)}/tree?${params}`
        );
        setTree(json.data?.tree ?? []);
      } catch {
        setTree([]);
      } finally {
        setIsLoadingTree(false);
      }
    },
    [repoSlug]
  );

  // ── Fetch commits ────────────────────────────────────────────────────────
  const fetchCommits = useCallback(
    async (branch: string) => {
      if (!repoSlug) return;
      try {
        const params = new URLSearchParams({ ref: branch, limit: "10" });
        const json = await apiFetch<{ success: boolean; data: { commits: RepoCommit[] } }>(
          `/api/v1/repositories/${encodeSlug(repoSlug)}/commits?${params}`
        );
        setCommits(json.data?.commits ?? []);
      } catch {
        setCommits([]);
      }
    },
    [repoSlug]
  );

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchRepo();
  }, [fetchRepo]);

  // ── When branch is set, load tree + commits ──────────────────────────────
  useEffect(() => {
    if (!currentBranch) return;
    fetchTree(currentBranch, currentPath);
    fetchCommits(currentBranch);
  }, [currentBranch, currentPath, fetchTree, fetchCommits]);

  // ── Navigate to a different directory ───────────────────────────────────
  const navigateTo = useCallback(
    (path: string) => {
      setActiveBlob(null);
      setCurrentPath(path === "" ? "." : path);
    },
    []
  );

  // ── Open a blob (file) ───────────────────────────────────────────────────
  const openBlob = useCallback(
    async (filePath: string) => {
      setIsLoadingBlob(true);
      try {
        const params = new URLSearchParams({ ref: currentBranch, path: filePath });
        const json = await apiFetch<{ success: boolean; data: BlobFile }>(
          `/api/v1/repositories/${encodeSlug(repoSlug)}/blob?${params}`
        );
        setActiveBlob(json.data);
      } catch {
        setActiveBlob(null);
      } finally {
        setIsLoadingBlob(false);
      }
    },
    [repoSlug, currentBranch]
  );

  const closeBlob = useCallback(() => setActiveBlob(null), []);

  // ── Switch branch ────────────────────────────────────────────────────────
  const switchBranch = useCallback((branch: string) => {
    setCurrentPath(".");
    setActiveBlob(null);
    setCurrentBranch(branch);
  }, []);

  // ── Upload a file ────────────────────────────────────────────────────────
  const uploadFile = useCallback(
    async (payload: UploadFilePayload): Promise<boolean> => {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);
      try {
        await apiFetch(`/api/v1/repositories/${encodeSlug(repoSlug)}/files`, {
          method: "POST",
          body: JSON.stringify({
            path: payload.path,
            content: payload.content,
            message: payload.message ?? `Upload ${payload.path.split("/").pop()}`,
            branch: payload.branch ?? currentBranch,
          }),
        });
        setUploadSuccess(true);
        // Refresh tree + commits after upload
        await fetchTree(currentBranch, currentPath);
        await fetchCommits(currentBranch);
        return true;
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed");
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [repoSlug, currentBranch, currentPath, fetchTree, fetchCommits]
  );

  // ── Edit a file (plain-text, no base64) ─────────────────────────────────
  const editFile = useCallback(
    async (payload: EditFilePayload): Promise<boolean> => {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);
      try {
        await apiFetch(`/api/v1/repositories/${encodeSlug(repoSlug)}/files`, {
          method: "PATCH",
          body: JSON.stringify({
            path: payload.path,
            content: payload.content,
            message: payload.message ?? `Edit ${payload.path.split("/").pop()}`,
            branch: payload.branch ?? currentBranch,
          }),
        });
        setUploadSuccess(true);
        await fetchTree(currentBranch, currentPath);
        await fetchCommits(currentBranch);
        return true;
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Save failed");
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [repoSlug, currentBranch, currentPath, fetchTree, fetchCommits]
  );

  const refetchTree = useCallback(() => {
    fetchTree(currentBranch, currentPath);
  }, [fetchTree, currentBranch, currentPath]);

  return {
    repo,
    tree,
    commits,
    activeBlob,
    currentPath,
    currentBranch,
    isLoadingRepo,
    isLoadingTree,
    isLoadingBlob,
    isUploading,
    error,
    uploadError,
    uploadSuccess,
    navigateTo,
    openBlob,
    closeBlob,
    switchBranch,
    uploadFile,
    editFile,
    refetchTree,
  };
}
