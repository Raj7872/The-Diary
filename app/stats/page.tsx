"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, LineChart, Line,
  ResponsiveContainer
} from "recharts";
import type { DiaryStats } from "@/types";
import Link from "next/link";
import { Film, Calendar, Star, TrendingUp } from "lucide-react";

const ACHIEVEMENTS = [
  { id: "first",   title: "First Date Night", emoji: "🎬", threshold: 1,   desc: "Watch your first movie together" },
  { id: "ten",     title: "Film Buffs",        emoji: "📽️",  threshold: 10,  desc: "Watch 10 movies together" },
  { id: "quarter", title: "Cinephiles",        emoji: "🏆",  threshold: 25,  desc: "Watch 25 movies together" },
  { id: "fifty",   title: "Movie Marathoners", emoji: "🌟",  threshold: 50,  desc: "Watch 50 movies together" },
  { id: "century", title: "Silver Screen Duo", emoji: "👑",  threshold: 100, desc: "Watch 100 movies together" },
];


function StatCard({ icon: Icon, label, value, sub, color = "rose" }: {
  icon: typeof Film; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    rose: "bg-rose-50 border-rose-200 text-rose-600",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
    warm: "bg-[#fdf5e8] border-[#e8dcc8] text-[#7a5c47]",
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`diary-card p-5 border ${colors[color] ?? colors.warm}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="opacity-70" />
        <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
      </div>
      <p className="text-3xl font-bold font-display">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </motion.div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<DiaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => setStats(d as import("@/types").DiaryStats))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="h-8 w-40 bg-[#e8dcc8] rounded mx-auto mb-2" />
          <div className="h-4 w-56 bg-[#e8dcc8] rounded mx-auto" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-[#e8dcc8] rounded-xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-[#e8dcc8] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!stats || stats.total_movies === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">📊</p>
        <p className="font-display text-xl text-[#3d2b1f]">No stats yet</p>
        <p className="text-[#9e7a60] text-sm mt-2">Add some movie memories to see your stats!</p>
        <Link href="/add" className="inline-block mt-4 px-5 py-2.5 bg-rose-400 text-white rounded-xl text-sm font-medium hover:bg-rose-500 transition-colors">
          Add First Entry 💕
        </Link>
      </div>
    );
  }

const ratingsDist = Array.from({ length: 10 }, (_, i) => i + 1).map(s => ({
  stars: String(s),
  count: (stats.ratings_distribution ?? []).find(r => r.stars === s)?.count ?? 0,
}));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="font-display text-3xl font-bold text-[#3d2b1f]">The Stats</h1>
        <p className="handwriting text-rose-400 text-lg mt-1">by the numbers 📊</p>
      </motion.div>

      {/* Top stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Film}     label="Total Movies"     value={stats.total_movies}      color="rose" />
        <StatCard icon={Star}     label="Average Rating"   value={`${stats.avg_rating}/10`} color="amber"
              sub={stats.avg_rating >= 8 ? "You love movies! 💕" : ""} />
        <StatCard icon={Calendar} label="This Year"        value={stats.movies_this_year}  color="warm"
          sub="films watched" />
        <StatCard icon={TrendingUp} label="This Month"     value={stats.movies_this_month} color="warm"
          sub="films watched" />
      </div>

      {/* Highlights */}
      {(stats.most_watched_genre || stats.longest_movie || stats.highest_rated) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="diary-card p-5 space-y-3">
          <h2 className="font-display font-semibold text-[#3d2b1f] text-lg">🏆 Highlights</h2>
          {stats.most_watched_genre && (
            <div className="flex items-center justify-between py-2 border-b border-[#f0e6d2]">
              <span className="text-sm text-[#7a5c47]">🎭 Favourite genre</span>
              <span className="font-medium text-[#3d2b1f] text-sm">{stats.most_watched_genre}</span>
            </div>
          )}
          {stats.longest_movie && (
            <div className="flex items-center justify-between py-2 border-b border-[#f0e6d2]">
              <span className="text-sm text-[#7a5c47]">⏱️ Longest movie</span>
              <span className="font-medium text-[#3d2b1f] text-sm">{stats.longest_movie.title} ({Math.floor(stats.longest_movie.runtime/60)}h {stats.longest_movie.runtime%60}m)</span>
            </div>
          )}
          {stats.highest_rated && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#7a5c47]">⭐ Top rated</span>
              <span className="font-medium text-[#3d2b1f] text-sm">{stats.highest_rated.title} ({stats.highest_rated.rating}/5)</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Genre chart */}
      {(stats.by_genre ?? []).length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="diary-card p-5">
          <h2 className="font-display font-semibold text-[#3d2b1f] text-lg mb-4">🎭 Movies by Genre</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={(stats.by_genre ?? []).slice(0, 8)} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d2" />
              <XAxis dataKey="genre" tick={{ fontSize: 11, fill: "#9e7a60" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9e7a60" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#fffdf7", border: "1px solid #e8dcc8", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: "#3d2b1f", fontWeight: 600 }}
              />
              <Bar dataKey="count" fill="#fb7185" radius={[6,6,0,0]} name="Movies" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Monthly chart */}
      {(stats.by_month ?? []).length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="diary-card p-5">
          <h2 className="font-display font-semibold text-[#3d2b1f] text-lg mb-4">📅 Movie Nights per Month</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={(stats.by_month ?? []).slice(-12)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d2" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9e7a60" }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "#9e7a60" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#fffdf7", border: "1px solid #e8dcc8", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: "#3d2b1f", fontWeight: 600 }}
              />
              <Line type="monotone" dataKey="count" stroke="#fb7185" strokeWidth={2.5} dot={{ fill: "#fb7185", r: 4 }} name="Movies" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Ratings distribution */}
      {(stats.ratings_distribution ?? []).length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="diary-card p-5">
          <h2 className="font-display font-semibold text-[#3d2b1f] text-lg mb-4">⭐ Rating Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ratingsDist} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d2" />
              <XAxis dataKey="stars" tick={{ fontSize: 13, fill: "#e3a857" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9e7a60" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#fffdf7", border: "1px solid #e8dcc8", borderRadius: 10, fontSize: 12 }}
              />
                  <Bar dataKey="count" radius={[6,6,0,0]} name="Movies">
                       {ratingsDist.map((_, i) => (
                      <Cell key={i} fill={`hsl(${350 - i * 10}, 70%, ${65 - i * 2}%)`} />
                     ))}
                  </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Achievements */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="diary-card p-5">
        <h2 className="font-display font-semibold text-[#3d2b1f] text-lg mb-4">🏅 Achievements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map(a => {
            const unlocked = stats.total_movies >= a.threshold;
            return (
              <div key={a.id} className={`badge-card ${!unlocked ? "locked" : ""}`}>
                <div className="text-3xl mb-2">{a.emoji}</div>
                <p className="font-semibold text-sm text-[#3d2b1f]">{a.title}</p>
                <p className="text-xs text-[#9e7a60] mt-1">{a.desc}</p>
                {unlocked && <p className="text-xs text-rose-400 font-medium mt-2">✓ Unlocked!</p>}
                {!unlocked && (
                  <p className="text-xs text-[#b8a090] mt-2">
                    {a.threshold - stats.total_movies} more to go
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
