"use client";
export const runtime = "edge";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Shuffle, Star, SlidersHorizontal, X } from "lucide-react";
import { NotificationBell } from "@/components/album/NotificationBell";
import { PolaroidCard }   from "@/components/album/PolaroidCard";
import { AlbumLightbox }  from "@/components/album/AlbumLightbox";
import { AddMemoryModal } from "@/components/album/AddMemoryModal";
import { DeleteConfirm }  from "@/components/album/DeleteConfirm";
import type { AlbumPhoto } from "@/components/album/types";
import { FloatingParticles } from "@/components/auth/FloatingParticles";

type Sort = "newest" | "oldest" | "favorites" | "random";

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest",    label: "Newest First" },
  { value: "oldest",    label: "Oldest First" },
  { value: "favorites", label: "Favorites First" },
  { value: "random",    label: "Random" },
];

export default function AlbumPage() {
  const [photos,      setPhotos]      = useState<AlbumPhoto[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [search,       setSearch]       = useState("");
  const [sort,         setSort]         = useState<Sort>("newest");
  const [favOnly,      setFavOnly]      = useState(false);
  const [showFilters,  setShowFilters]  = useState(false);

  // UI state
  const [lightboxIdx,  setLightboxIdx]  = useState<number | null>(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AlbumPhoto | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const PAGE_SIZE = 24;
  const loaderRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchPhotos(p: number, replace: boolean) {
    if (p === 1) setLoading(true); else setLoadingMore(true);

    const params = new URLSearchParams({
      page:      String(p),
      limit:     String(PAGE_SIZE),
      sort,
      favorites: favOnly ? "1" : "0",
    });
    if (search.trim()) params.set("search", search.trim());

    try {
      const res  = await fetch(`/api/album?${params}`);
      const data = await res.json() as { items?: AlbumPhoto[]; total?: number };
      const items = data.items ?? [];
      const count = data.total ?? 0;
      setTotal(count);
      setPhotos(prev => replace ? items : [...prev, ...items]);
      setHasMore(p * PAGE_SIZE < count);
      setPage(p);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPhotos(1, true), 350);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort, favOnly]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        fetchPhotos(page + 1, false);
      }
    }, { threshold: 0.1 });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, page]);

  const handleToggleFavorite = useCallback(async (photo: AlbumPhoto) => {
    const next = photo.favorite === 1 ? 0 : 1;
    setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, favorite: next } : p));
    await fetch(`/api/album/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite: next }),
    });
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/album/${deleteTarget.id}`, { method: "DELETE" });
    setPhotos(prev => prev.filter(p => p.id !== deleteTarget.id));
    setTotal(t => t - 1);
    if (lightboxIdx !== null) setLightboxIdx(null);
    setDeleteTarget(null);
    setDeleting(false);
  }

  async function handleSurprise() {
    const res = await fetch("/api/album/random");
    if (!res.ok) return;
    const data = await res.json() as { data: AlbumPhoto };
    // Find or prepend surprise photo, then open it
    const existingIdx = photos.findIndex(p => p.id === data.data.id);
    if (existingIdx !== -1) {
      setLightboxIdx(existingIdx);
    } else {
      setPhotos(prev => [data.data, ...prev]);
      setLightboxIdx(0);
    }
  }

  function handleAdded(photo: AlbumPhoto) {
    setPhotos(prev => [photo, ...prev]);
    setTotal(t => t + 1);
    setShowAdd(false);
  }

  const isEmpty = !loading && (photos ?? []).length === 0;

  return (
    <div className="relative min-h-screen">
      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <FloatingParticles />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 pb-24">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-4xl font-bold text-[#3d2b1f]">The Album</h1>
          <p className="handwriting text-rose-400 text-xl mt-1">
            A collection of little moments we never want to forget.
          </p>
          {total > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-sm text-[#9e7a60]"
            >
              {total} {total === 1 ? "memory" : "memories"} saved
            </motion.p>
          )}
        </motion.div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e7a60]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search captions…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#e8dcc8] rounded-xl text-sm text-[#3d2b1f] placeholder:text-[#b8a090] focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={13} className="text-[#9e7a60]" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm border transition-all ${
                showFilters || favOnly || sort !== "newest"
                  ? "bg-rose-100 border-rose-300 text-rose-600"
                  : "bg-white border-[#e8dcc8] text-[#7a5c47]"
              }`}
            >
              <SlidersHorizontal size={14} />
              Filter
            </button>
            
            {/* Surprise */}
            {total > 0 && (
              <button
                onClick={handleSurprise}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm border bg-white border-[#e8dcc8] text-[#7a5c47] hover:border-rose-200 hover:bg-rose-50 transition-all"
                title="Surprise Memory"
              >
                <Shuffle size={14} />
                <span className="hidden sm:inline">Surprise</span>
              </button>
            )}

            {/* Add */}
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-400 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <Plus size={15} />
              <span>Add Memory</span>
            </button>
                                  {/* Notification bell */}
          {total > 0 && (
            <NotificationBell
              onOpenPhoto={(photoId) => {
                const idx = photos.findIndex(p => p.id === photoId);
                if (idx !== -1) {
                  setLightboxIdx(idx);
                } else {
                  // Photo not in current view — fetch and open it
                  fetch(`/api/album/${photoId}`)
                    .then(r => r.json() as Promise<{ data: AlbumPhoto }>)
                    .then(d => {
                      setPhotos(prev => [d.data, ...prev]);
                      setLightboxIdx(0);
                    })
                    .catch(() => {});
                }
              }}
            />
          )}
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="diary-card p-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-[#9e7a60] uppercase tracking-wide mb-2">Sort</p>
                  <div className="flex flex-wrap gap-2">
                    {SORTS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setSort(s.value)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                          sort === s.value
                            ? "bg-rose-100 border-rose-300 text-rose-700 font-medium"
                            : "bg-white border-[#e8dcc8] text-[#7a5c47]"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setFavOnly(f => !f)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all ${
                    favOnly
                      ? "bg-amber-50 border-amber-300 text-amber-700 font-medium"
                      : "bg-white border-[#e8dcc8] text-[#7a5c47]"
                  }`}
                >
                  <Star size={12} className={favOnly ? "fill-amber-400 text-amber-400" : ""} />
                  Favorites only
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="text-7xl mb-5">📷</div>
            <p className="font-display text-2xl text-[#3d2b1f]">
              {search || favOnly
                ? "No memories match your search."
                : "Our story is waiting for its first memory."}
            </p>
            <p className="handwriting text-rose-400 text-xl mt-2">
              {search || favOnly ? "Try a different filter." : "Every moment deserves to be remembered."}
            </p>
            {!search && !favOnly && (
              <button
                onClick={() => setShowAdd(true)}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-xl font-semibold transition-colors shadow-md"
              >
                <Plus size={18} /> Add First Photo
              </button>
            )}
          </motion.div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="break-inside-avoid bg-white rounded-sm animate-pulse"
                style={{ padding: "10px 10px 40px 10px", height: 200 + (i % 3) * 60 }}
              >
                <div className="w-full h-full bg-[#f0e6d2] rounded-sm" />
              </div>
            ))}
          </div>
        )}

        {/* Masonry photo grid */}
        {!loading && photos.length > 0 && (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
            {photos.map((photo, i) => (
              <div key={photo.id} className="break-inside-avoid">
                <PolaroidCard
                  photo={photo}
                  index={i}
                  onClick={() => setLightboxIdx(i)}
                  onDelete={() => setDeleteTarget(photo)}
                  onToggleFavorite={() => handleToggleFavorite(photo)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll loader */}
        <div ref={loaderRef} className="py-6 flex justify-center">
          {loadingMore && (
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-rose-300 rounded-full"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <AlbumLightbox
          photos={photos}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onChange={setLightboxIdx}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Add Memory modal */}
      {showAdd && (
        <AddMemoryModal
          onClose={() => setShowAdd(false)}
          onSaved={handleAdded}
        />
      )}

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirm
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
