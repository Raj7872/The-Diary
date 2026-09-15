"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEntries } from "@/hooks/use-entries";
import { EntryCard } from "@/components/diary/EntryCard";
import { useDiaryStore } from "@/store";
import Link from "next/link";

const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Romance", "Science Fiction", "Thriller"];
const YEARS  = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));
const SORTS  = [
  { value: "newest",        label: "Newest first" },
  { value: "oldest",        label: "Oldest first" },
  { value: "highest_rated", label: "Highest rated" },
];

export default function EntriesPage() {
  const { filters, setFilters, resetFilters } = useDiaryStore();
  const { data, loading } = useEntries(filters);
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = !!(filters.genre || filters.year || filters.search || filters.sort !== "newest");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-[#3d2b1f]">The Diary</h1>
        <p className="handwriting text-rose-400 text-lg mt-1">every film, every night together 🎞️</p>
        {data && <p className="text-sm text-[#9e7a60] mt-2">{data.total} {data.total === 1 ? "entry" : "entries"}</p>}
      </motion.div>

      {/* Search + Filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e7a60]" />
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters({ search: e.target.value })}
            placeholder="Search movies…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#e8dcc8] rounded-xl text-sm text-[#3d2b1f] placeholder:text-[#b8a090] focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition"
          />
        </div>
        <button
          onClick={() => setShowFilters(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm border transition-all ${
            showFilters || hasActiveFilters
              ? "bg-rose-100 border-rose-300 text-rose-600"
              : "bg-white border-[#e8dcc8] text-[#7a5c47]"
          }`}
        >
          <SlidersHorizontal size={15} />
          Filter
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-rose-400 ml-0.5" />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="diary-card p-4 mb-4 space-y-4"
        >
          <div>
            <p className="text-xs font-semibold text-[#9e7a60] uppercase tracking-wide mb-2">Sort</p>
            <div className="flex flex-wrap gap-2">
              {SORTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setFilters({ sort: s.value as typeof filters.sort })}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                    filters.sort === s.value
                      ? "bg-rose-100 border-rose-300 text-rose-700 font-medium"
                      : "bg-white border-[#e8dcc8] text-[#7a5c47]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#9e7a60] uppercase tracking-wide mb-2">Genre</p>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => setFilters({ genre: filters.genre === g ? "" : g })}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                    filters.genre === g
                      ? "bg-rose-100 border-rose-300 text-rose-700 font-medium"
                      : "bg-white border-[#e8dcc8] text-[#7a5c47]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#9e7a60] uppercase tracking-wide mb-2">Year</p>
            <div className="flex flex-wrap gap-1.5">
              {YEARS.map(y => (
                <button
                  key={y}
                  onClick={() => setFilters({ year: filters.year === y ? "" : y })}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                    filters.year === y
                      ? "bg-rose-100 border-rose-300 text-rose-700 font-medium"
                      : "bg-white border-[#e8dcc8] text-[#7a5c47]"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700">
              <X size={12} /> Clear all filters
            </button>
          )}
        </motion.div>
      )}

      {/* Entries */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="diary-card p-4 flex gap-4 animate-pulse">
              <div className="w-16 h-24 rounded-lg bg-[#e8dcc8]" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-[#e8dcc8] rounded w-3/4" />
                <div className="h-3 bg-[#e8dcc8] rounded w-1/3" />
                <div className="h-3 bg-[#e8dcc8] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="text-5xl mb-4">📖</div>
          <p className="font-display text-xl text-[#3d2b1f]">
            {hasActiveFilters ? "No matches found" : "Your diary is empty"}
          </p>
          <p className="text-[#9e7a60] mt-2 text-sm">
            {hasActiveFilters ? "Try clearing some filters" : "Add your first movie memory!"}
          </p>
          {!hasActiveFilters && (
            <Link
              href="/add"
              className="inline-block mt-4 px-5 py-2.5 bg-rose-400 text-white rounded-xl text-sm font-medium hover:bg-rose-500 transition-colors"
            >
              Add First Entry 💕
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((entry, i) => (
            <EntryCard key={entry.id} entry={entry} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
