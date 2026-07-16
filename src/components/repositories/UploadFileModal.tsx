
"use client";

import { useState, useRef, useCallback } from "react";
import type { UploadFilePayload } from "@/hooks/useRepoDetail";

interface UploadFileModalProps {
  isOpen: boolean;
  repoName: string;
  branch: string;
  currentPath: string;
  isUploading: boolean;
  uploadError: string | null;
  onUpload: (payload: UploadFilePayload) => Promise<boolean>;
  onClose: () => void;
}

export function UploadFileModal({
  isOpen,
  repoName,
  branch,
  currentPath,
  isUploading,
  uploadError,
  onUpload,
  onClose,
}: UploadFileModalProps) {
  const [fileName, setFileName] = useState("");
  const [commitMsg, setCommitMsg] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [tab, setTab] = useState<"editor" | "upload">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFileName("");
    setCommitMsg("");
    setFileContent("");
    setSelectedFileName(null);
    setDragOver(false);
    setTab("upload");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Read file → base64
  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data URL prefix: "data:*/*;base64,"
        const base64 = result.split(",")[1] ?? result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFileName(file.name);
    if (!fileName) setFileName(file.name);
    const b64 = await readFileAsBase64(file);
    setFileContent(b64);
  }, [fileName]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) await handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleEditorContent = (text: string) => {
    // For manual text editor, convert text to base64
    const b64 = btoa(unescape(encodeURIComponent(text)));
    setFileContent(b64);
  };

  const buildFilePath = () => {
    const name = fileName.trim();
    if (!name) return "";
    if (currentPath === "." || currentPath === "/" || currentPath === "") {
      return name;
    }
    return `${currentPath}/${name}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filePath = buildFilePath();
    if (!filePath || !fileContent) return;

    const ok = await onUpload({
      path: filePath,
      content: fileContent,
      message: commitMsg.trim() || `Upload ${fileName}`,
      branch,
    });

    if (ok) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  const filePath = buildFilePath();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold text-base">Upload file</h2>
            <p className="text-white/40 text-xs mt-0.5">
              <span className="text-white/60">{repoName}</span>
              <span className="mx-1 text-white/30">/</span>
              <span className="text-emerald-400">{branch}</span>
              {filePath && (
                <>
                  <span className="mx-1 text-white/30">/</span>
                  <span className="text-white/60">{filePath}</span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-white/40 hover:text-white transition-colors p-1 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tab switcher */}
          <div className="flex rounded-lg overflow-hidden border border-white/10 text-sm">
            <button
              type="button"
              onClick={() => setTab("upload")}
              className={`flex-1 py-2 transition-colors cursor-pointer ${
                tab === "upload"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Upload file
            </button>
            <button
              type="button"
              onClick={() => setTab("editor")}
              className={`flex-1 py-2 transition-colors cursor-pointer ${
                tab === "editor"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Create new file
            </button>
          </div>

          {/* Upload tab */}
          {tab === "upload" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-emerald-400/60 bg-emerald-400/5"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleInputChange}
              />
              <svg className="w-8 h-8 mx-auto mb-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {selectedFileName ? (
                <p className="text-emerald-400 text-sm font-medium">{selectedFileName}</p>
              ) : (
                <>
                  <p className="text-white/60 text-sm">Drag & drop a file here, or click to select</p>
                  <p className="text-white/30 text-xs mt-1">Any file type supported</p>
                </>
              )}
            </div>
          )}

          {/* Editor tab */}
          {tab === "editor" && (
            <div className="space-y-2">
              <label className="text-white/60 text-xs font-medium uppercase tracking-wide">
                File content
              </label>
              <textarea
                rows={8}
                placeholder="Paste or type file content here..."
                onChange={(e) => handleEditorContent(e.target.value)}
                className="w-full bg-[#161b22] border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm font-mono placeholder-white/20 focus:outline-none focus:border-emerald-400/50 resize-none"
              />
            </div>
          )}

          {/* File name */}
          <div className="space-y-1">
            <label className="text-white/60 text-xs font-medium uppercase tracking-wide">
              File name
              <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. README.md or src/main.go"
              required
              className="w-full bg-[#161b22] border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm placeholder-white/20 focus:outline-none focus:border-emerald-400/50"
            />
            {currentPath !== "." && currentPath !== "/" && (
              <p className="text-white/30 text-xs">
                Will be saved as: <span className="text-white/50">{currentPath}/{fileName || "…"}</span>
              </p>
            )}
          </div>

          {/* Commit message */}
          <div className="space-y-1">
            <label className="text-white/60 text-xs font-medium uppercase tracking-wide">
              Commit message
            </label>
            <input
              type="text"
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              placeholder={`Upload ${fileName || "file"}`}
              className="w-full bg-[#161b22] border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm placeholder-white/20 focus:outline-none focus:border-emerald-400/50"
            />
          </div>

          {/* Branch indicator */}
          <div className="flex items-center gap-2 text-xs text-white/40 bg-white/5 rounded-lg px-2 py-2">
            Committing to <span className="text-emerald-400 font-medium ml-1">{branch}</span>
          </div>

          {/* Error */}
          {uploadError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {uploadError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !fileName.trim() || !fileContent}
              className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading…
                </>
              ) : (
                "Commit file"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
