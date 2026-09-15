"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Clapperboard, Moon, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSettings } from "@/components/album/useSettings";
import type { WishlistItem } from "@/types";

const AUTHOR_KEY = "album_last_author";

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 bg-white border border-[#e8dcc8] rounded-xl text-sm text-[#3d2b1f] placeholder:text-[#b8a090] focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition ${className}`}
    />
  );
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-3 py-2.5 bg-white border border-[#e8dcc8] rounded-xl text-sm text-[#3d2b1f] placeholder:text-[#b8a090] focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition resize-none ${className}`}
    />
  );
}

export default function WishlistPage() {
  const { settings } = useSettings();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [addedBy, setAddedBy] = useState<"1" | "2">(
    typeof window !== "undefined" && localStorage.getItem(AUTHOR_KEY) === "2" ? "2" : "1"
  );
  const [title, setTitle] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [runtime, setRuntime] = useState("");
  const [remark, setRemark] = useState("");

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/wishlist");
      const data = await res.json() as { items?: WishlistItem[] };
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadItems(); }, []);

  function resetForm() {
    setTitle(""); setPosterUrl(""); setRuntime(""); setRemark("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          added_by: addedBy,
          title: title.trim(),
          poster_url: posterUrl.trim() || undefined,
          runtime: runtime ? Number(runtime) : undefined,
          remark: remark.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");

      toast({ title: "Added to the wishlist! 🌙✨", description: `"${title.trim()}" is on the list.` });
      resetForm();
      setShowForm(false);
      loadItems();
    } catch (err) {
      console.error(err);
      toast({ title: "Couldn't add it", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: WishlistItem) {
    if (!confirm(`Remove "${item.title}" from the wishlist?`)) return;
    setItems(prev => prev.filter(i => i.id !== item.id));
    await fetch(`/api/wishlist/${item.id}`, { method: "DELETE" });
    toast({ title: "Removed from wishlist" });
  }

  function watchedHref(item: WishlistItem) {
    const params = new URLSearchParams();
    params.set("title", item.title);
    if (item.poster_url) params.set("poster_url", item.poster_url);
    if (item.runtime) params.set("runtime", String(item.runtime));
    params.set("wishlist_id", String(item.id));
    return `/add?${params.toString()}`;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      <Link href="/home" className="inline-flex items-center gap-1.5 text-sm text-[#9e7a60] hover:text-violet-500 transition-colors mb-4">
        <ArrowLeft size={15} /> Back home
      </Link>

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="text-5xl mb-2">🌙</div>
        <h1 className="font-display text-3xl font-bold text-[#3d2b1f]">The Wishlist</h1>
        <p className="handwriting text-violet-400 text-lg mt-1">movies we wanna watch together 💫</p>
      </motion.div>

      {!showForm ? (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-violet-400 hover:bg-violet-500 text-white rounded-xl font-semibold text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 mb-6"
        >
          <Plus size={18} />
          Add to Wishlist
        </motion.button>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAdd}
          className="diary-card p-5 space-y-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#3d2b1f]">🌙 New Wishlist Idea</h2>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="text-[#b8a090] hover:text-[#3d2b1f]">
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-2">
            {(["1", "2"] as const).map(a => {
              const name  = a === "1" ? settings.person1_name  : settings.person2_name;
              const emoji = a === "1" ? settings.person1_emoji : settings.person2_emoji;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => { setAddedBy(a); localStorage.setItem(AUTHOR_KEY, a); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    addedBy === a
                      ? a === "1" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-rose-50 border-rose-300 text-rose-600"
                      : "bg-white border-[#e8dcc8] text-[#7a5c47]"
                  }`}
                >
                  <span>{emoji}</span> {name}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#3d2b1f]">Name <span className="text-rose-400">*</span></label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. La La Land" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#3d2b1f]">Banner</label>
            <Input value={posterUrl} onChange={e => setPosterUrl(e.target.value)} placeholder="Paste a poster image URL" />
          </div>

          {posterUrl && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 p-3 bg-[#faf6ff] rounded-xl border border-[#e8dcc8]">
              <Image src={posterUrl} alt="Banner preview" width={50} height={75} className="rounded-lg shadow-sm object-cover" unoptimized />
              <div className="flex-1 min-w-0 flex items-center">
                <p className="font-medium text-[#3d2b1f] text-sm truncate">{title || "Preview"}</p>
              </div>
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#3d2b1f]">Length (min)</label>
            <Input type="number" value={runtime} onChange={e => setRuntime(e.target.value)} placeholder="120" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#3d2b1f]">Remark</label>
            <Textarea rows={2} value={remark} onChange={e => setRemark(e.target.value)} placeholder="Why do we wanna watch this? 💭" className="diary-lines" />
          </div>

          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-violet-400 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "🌙 Add to Wishlist"}
          </button>
        </motion.form>
      )}

      {loading ? (
        <p className="text-center text-sm text-[#9e7a60] py-10">Loading your wishlist…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🌙💭</div>
          <p className="text-[#7a5c47]">Nothing here yet — add your first movie idea!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <AnimatePresence>
            {items.map(item => {
              const emoji = item.added_by === "1" ? settings.person1_emoji : settings.person2_emoji;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="diary-card overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[2/3] bg-gradient-to-br from-violet-100 to-rose-50 flex items-center justify-center">
                    {item.poster_url ? (
                      <Image src={item.poster_url} alt={item.title} fill className="object-cover" unoptimized />
                    ) : (
                      <span className="text-3xl">🎬</span>
                    )}
                    <span className="absolute top-1.5 right-1.5 text-sm bg-white/90 rounded-full w-6 h-6 flex items-center justify-center shadow-sm" title="Added by">
                      {emoji}
                    </span>
                  </div>

                  <div className="p-3 flex-1 flex flex-col gap-1.5">
                    <p className="font-medium text-sm text-[#3d2b1f] leading-snug line-clamp-2">{item.title}</p>
                    {item.runtime ? (
                      <p className="text-xs text-[#9e7a60]">⏱ {item.runtime} min</p>
                    ) : null}
                    {item.remark ? (
                      <p className="handwriting text-violet-500 text-sm leading-tight line-clamp-2 mt-0.5">&ldquo;{item.remark}&rdquo;</p>
                    ) : null}

                    <div className="mt-auto pt-2 flex items-center gap-1.5">
                      <Link
                        href={watchedHref(item)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-400 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <Clapperboard size={12} /> Watched it!
                      </Link>
                      <button
                        onClick={() => handleDelete(item)}
                        title="Remove"
                        className="p-1.5 text-[#b8a090] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {items.length > 0 && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-[#b8a090] mt-8">
          <Moon size={12} /> {items.length} {items.length === 1 ? "idea" : "ideas"} waiting to be watched
        </p>
      )}
    </div>
  );
}
