"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Star, Loader2, ImagePlus } from "lucide-react";
import { useSettings } from "./useSettings";
import type { AlbumPhoto } from "./types";

const AUTHOR_KEY = "album_last_author";

interface Props {
  onClose:  () => void;
  onSaved:  (photo: AlbumPhoto) => void;
}

interface Preview {
  file:     File;
  localUrl: string;
}

export function AddMemoryModal({ onClose, onSaved }: Props) {
  const { settings } = useSettings();
  const [previews, setPreviews]   = useState<Preview[]>([]);
  const [caption, setCaption]     = useState("");
  const [takenDate, setTakenDate] = useState("");
  const [favorite, setFavorite]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const savedAuthor = typeof window !== "undefined" ? localStorage.getItem(AUTHOR_KEY) : null;
  const [addedBy, setAddedBy] = useState<"1" | "2">(savedAuthor === "2" ? "2" : "1");

  function selectAddedBy(a: "1" | "2") {
    setAddedBy(a);
    localStorage.setItem(AUTHOR_KEY, a);
  }

  function handleFiles(files: FileList) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const valid   = Array.from(files).filter(f =>
      allowed.includes(f.type) && f.size <= 25 * 1024 * 1024
    );
    if (valid.length !== files.length) {
      setError("Some files were skipped. Only JPG, PNG, WEBP, GIF under 25 MB allowed.");
    }
    setPreviews(valid.map(file => ({ file, localUrl: URL.createObjectURL(file) })));
  }

  function removePreview(i: number) {
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (previews.length === 0) return;
    setUploading(true);
    setError("");

    let lastSaved: AlbumPhoto | null = null;
    const total = previews.length;

    for (let i = 0; i < total; i++) {
      const { file } = previews[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        // Step 1 — Upload to R2
        const uploadRes  = await fetch("/api/album/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploaded   = await uploadRes.json() as { image_url: string; r2_key: string; id: string };

        // Step 2 — Save to D1
        const saveRes = await fetch("/api/album", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id:         uploaded.id,
            image_url:  uploaded.image_url,
            r2_key:     uploaded.r2_key,
            caption:    caption || null,
            taken_date: takenDate || null,
            favorite:   favorite ? 1 : 0,
            added_by:   addedBy,
          }),
        });
        if (!saveRes.ok) throw new Error("Save failed");
        const saved = (await saveRes.json() as { data: AlbumPhoto }).data;
        lastSaved = saved;
      } catch (e) {
        setError(`Failed to upload photo ${i + 1}: ${String(e)}`);
      }

      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setUploading(false);
    if (lastSaved) onSaved(lastSaved);
    if (!error)    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        key="add-memory-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <motion.div
          key="add-memory-sheet"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={e => e.stopPropagation()}
          className="relative z-10 bg-[#fffdf7] w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          style={{ border: "1px solid #e8dcc8" }}
        >
          {/* Handle bar (mobile) */}
          <div className="w-10 h-1 bg-[#e8dcc8] rounded-full mx-auto mb-5 sm:hidden" />

          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-semibold text-[#3d2b1f]">Add Memory 📸</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f0e6d2] transition-colors">
              <X size={18} className="text-[#9e7a60]" />
            </button>
          </div>

          {/* Drop zone */}
          {previews.length === 0 ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              onDragOver={e => e.preventDefault()}
              className="border-2 border-dashed border-[#e8dcc8] rounded-2xl p-10 text-center cursor-pointer hover:border-rose-300 hover:bg-rose-50/30 transition-colors mb-4"
            >
              <ImagePlus size={32} className="mx-auto text-[#c99f7f] mb-3" />
              <p className="text-sm font-medium text-[#7a5c47]">Drop photos here or tap to choose</p>
              <p className="text-xs text-[#b8a090] mt-1">JPG, PNG, WEBP, GIF · max 25 MB each</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={e => e.target.files && handleFiles(e.target.files)}
              />
            </div>
          ) : (
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-2 mb-2">
                {previews.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#f0e6d2] group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.localUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePreview(i)}
                      className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      <X size={11} className="text-[#3d2b1f]" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-[#e8dcc8] flex items-center justify-center hover:border-rose-300 transition-colors"
                >
                  <Upload size={18} className="text-[#c99f7f]" />
                </button>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={e => e.target.files && handleFiles(e.target.files)}
              />
            </div>
          )}

          {/* Caption */}
          <div className="space-y-3 mb-5">
            <div>
              <label className="text-sm font-medium text-[#3d2b1f] block mb-1.5">
                Who&apos;s adding this?
              </label>
              <div className="flex gap-2">
                {(["1", "2"] as const).map(a => {
                  const name  = a === "1" ? settings.person1_name  : settings.person2_name;
                  const emoji = a === "1" ? settings.person1_emoji : settings.person2_emoji;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => selectAddedBy(a)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        addedBy === a
                          ? a === "1"
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-rose-50 border-rose-300 text-rose-600"
                          : "bg-white border-[#e8dcc8] text-[#7a5c47]"
                      }`}
                    >
                      <span>{emoji}</span> {name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#3d2b1f] block mb-1.5">
                Caption <span className="text-[#b8a090] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="The sunset after our movie night…"
                className="w-full px-3 py-2.5 bg-white border border-[#e8dcc8] rounded-xl text-sm text-[#3d2b1f] placeholder:text-[#b8a090] focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition handwriting text-base"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#3d2b1f] block mb-1.5">
                Date Taken <span className="text-[#b8a090] font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={takenDate}
                onChange={e => setTakenDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#e8dcc8] rounded-xl text-sm text-[#3d2b1f] focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition"
              />
            </div>

            {/* Favorite toggle */}
            <button
              type="button"
              onClick={() => setFavorite(f => !f)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                favorite
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "bg-white border-[#e8dcc8] text-[#7a5c47]"
              }`}
            >
              <Star size={15} className={favorite ? "fill-amber-400 text-amber-400" : ""} />
              {favorite ? "Marked as Favorite ⭐" : "Mark as Favorite"}
            </button>
          </div>

          {/* Progress */}
          {uploading && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-[#9e7a60] mb-1.5">
                <Loader2 size={13} className="animate-spin" />
                Uploading… {progress}%
              </div>
              <div className="h-1.5 bg-[#f0e6d2] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-rose-400 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-rose-500 mb-3">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#f5ede4] text-[#3d2b1f] rounded-xl text-sm font-medium border border-[#e8dcc8] hover:bg-[#ead8c8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={previews.length === 0 || uploading}
              className="flex-1 py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : null}
              {uploading ? "Saving…" : `Save ${previews.length > 1 ? `${previews.length} Photos` : "Memory"} 💕`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
