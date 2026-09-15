"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, BarChart2, Plus, Shuffle, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


function FloatingHeart({ emoji, style }: { emoji: string; style: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute select-none pointer-events-none text-2xl"
      style={style}
      animate={{ y: [-8, 8, -8], rotate: [-5, 5, -5] }}
      transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
    >
      {emoji}
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [totalMovies, setTotalMovies] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/stats").then(r => r.ok ? (r.json() as Promise<import("@/types").DiaryStats>) : null).then(d => {
      if (d?.total_movies != null) setTotalMovies(d.total_movies);
    }).catch(() => {});
  }, []);

  async function handleRandom() {
    const res = await fetch("/api/random");
    if (res.ok) {
      const data = await res.json() as { data?: { id: number } };
      if (data?.data?.id) router.push(`/entries/${data.data.id}`);
    }
  }

  const floaters = [
    { emoji: "💕", style: { top: "12%", left: "8%" } },
    { emoji: "🎬", style: { top: "20%", right: "10%" } },
    { emoji: "✨", style: { top: "60%", left: "5%" } },
    { emoji: "🍿", style: { bottom: "25%", right: "8%" } },
    { emoji: "💖", style: { top: "40%", right: "5%" } },
    { emoji: "🎞️", style: { bottom: "35%", left: "10%" } },
    { emoji: "💝", style: { top: "75%", right: "15%" } },
    { emoji: "💗", style: { top: "8%", right: "30%" } },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Floating decorations */}
      {floaters.map((f, i) => <FloatingHeart key={i} emoji={f.emoji} style={f.style} />)}

      {/* Diary cover card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative w-full max-w-lg"
      >
        {/* Spine decoration */}
        <div className="absolute -left-3 top-6 bottom-6 w-3 rounded-l-md bg-gradient-to-b from-rose-300 via-rose-400 to-rose-300 shadow-md hidden md:block" />

        <div className="relative bg-[#fffdf7] border border-[#e8dcc8] rounded-2xl shadow-[0_8px_40px_rgba(61,43,31,0.14)] p-10 text-center">
          {/* Top washi tape */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-rose-200/60 rounded-sm rotate-[-1deg]" />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="text-6xl mb-4"
          >
            🎬
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-display text-4xl md:text-5xl font-bold text-[#3d2b1f] leading-tight"
          >
            The Diary
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="handwriting text-rose-400 text-xl mt-3 leading-relaxed"
          >
            Every movie. Every memory. Every date.
          </motion.p>

          {totalMovies !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 inline-block bg-rose-50 border border-rose-200 rounded-full px-4 py-1 text-sm text-rose-600 font-medium"
            >
              📚 {totalMovies} {totalMovies === 1 ? "memory" : "memories"} saved
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="mt-8 flex flex-col gap-3"
          >
            <Link
              href="/add"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-rose-400 hover:bg-rose-500 text-white rounded-xl font-semibold text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={18} />
              Add Movie Entry
            </Link>

            <Link
              href="/entries"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#f5ede4] hover:bg-[#ead8c8] text-[#3d2b1f] rounded-xl font-semibold text-base transition-all border border-[#e8dcc8]"
            >
              <BookOpen size={18} />
              Browse Diary
            </Link>

            <Link
              href="/wishlist"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl font-semibold text-base transition-all border border-violet-200 hover:shadow-md group"
            >
              <Moon size={18} className="group-hover:scale-110 transition-transform" />
              Wishlist
            </Link>

            <div className="flex gap-3">
              <Link
                href="/stats"
                className="flex items-center justify-center gap-2 flex-1 py-3 bg-cream-100 hover:bg-[#ead8c8] text-[#3d2b1f] rounded-xl font-medium text-sm transition-all border border-[#e8dcc8]"
              >
                <BarChart2 size={16} />
                Statistics
              </Link>
              <button
                onClick={handleRandom}
                className="flex items-center justify-center gap-2 flex-1 py-3 bg-cream-100 hover:bg-[#ead8c8] text-[#3d2b1f] rounded-xl font-medium text-sm transition-all border border-[#e8dcc8]"
              >
                <Shuffle size={16} />
                Surprise Me ✨
              </button>
            </div>
              <Link
                  href="/album"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#fdf5e8] hover:bg-[#f5e6cc] text-[#3d2b1f] rounded-xl font-semibold text-base transition-all border border-[#e8dcc8] hover:border-[#d4a843] hover:shadow-md group">
                <span className="group-hover:scale-110 transition-transform text-xl">📸</span>
                    The Album
              </Link>


          </motion.div>

          {/* Bottom sticker row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 flex items-center justify-center gap-3 text-2xl"
          >
            {["🎥", "🍿", "❤️", "🎞️", "✨"].map((e, i) => (
              <motion.span
                key={i}
                animate={{ rotate: [-3, 3, -3] }}
                transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
              >
                {e}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="flex flex-wrap justify-center gap-2 mt-8 max-w-md"
      >
        {["Full of Cuteness 💖", "Filled with Love ❤️", "Sweet Memories 📖", "Shared Feelings 🌙", "Milestones Together ✨", "Our Story 🎞️"].map(f => (
          <span key={f} className="text-xs bg-white/70 border border-[#e8dcc8] px-3 py-1 rounded-full text-[#7a5c47]">
            {f}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
