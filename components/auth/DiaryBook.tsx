"use client";
import { useState } from "react";
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from "framer-motion";
import { Lock, ArrowRight, Loader2 } from "lucide-react";

const CUTE_QUOTES = [
  "Every movie night is a page in our story.",
  "Two hearts, one couch, infinite movies.",
  "Made of popcorn, blankets, and us.",
  "Some stories are meant to be watched together.",
  "Our favorite genre? Each other.",
  "Pause the world, press play on us.",
];

interface DiaryBookProps {
  onAuthenticated: () => void;
}

export function DiaryBook({ onAuthenticated }: DiaryBookProps) {
  const [stage, setStage] = useState<"closed" | "opening" | "open" | "success">("closed");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const shakeControls = useAnimationControls();
  const reducedMotion = useReducedMotion();

  // Deterministic per-day quote (avoids hydration mismatch)
  const quote = CUTE_QUOTES[new Date().getDate() % CUTE_QUOTES.length];

  function handleOpen() {
    if (stage !== "closed") return;
    setStage("opening");
    setTimeout(() => setStage("open"), reducedMotion ? 0 : 900);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setStage("success");
        setTimeout(onAuthenticated, reducedMotion ? 200 : 1000);
      } else {
        setError("That's not Our Secret code Cutie.");
        shakeControls.start({
          x: [0, -10, 10, -8, 8, -4, 4, 0],
          transition: { duration: 0.45 },
        });
      }
    } catch {
      setError("Something went wrong. Try again?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center" style={{ perspective: 1400 }}>
      {/* Cute quote sticky note — only before opening */}
      <AnimatePresence>
        {stage === "closed" && (
          <motion.div
            initial={{ opacity: 0, y: -8, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mb-5 bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg shadow-sm handwriting text-rose-500 text-base"
          >
            &ldquo;{quote}&rdquo;
          </motion.div>
        )}
      </AnimatePresence>

      {/* The book */}
      <motion.div
        animate={shakeControls}
        className="relative w-[85vw] max-w-sm sm:max-w-md"
      >
        {/* Page edges behind the cover */}
        <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl bg-[#fffdf7] border border-[#e8dcc8]" />
        <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-[#fdf8ec] border border-[#e8dcc8]" />

        {/* Cover */}
        <motion.div
          role={stage === "closed" ? "button" : undefined}
          tabIndex={stage === "closed" ? 0 : -1}
          aria-label={stage === "closed" ? "Open the diary" : undefined}
          onClick={handleOpen}
          onKeyDown={(e) => {
            if (stage === "closed" && (e.key === "Enter" || e.key === " ")) handleOpen();
          }}
          whileHover={
            stage === "closed" && !reducedMotion
              ? { rotateX: -3, rotateY: 4, y: -6, boxShadow: "0 35px 70px -15px rgba(61,43,31,0.4)" }
              : undefined
          }
          animate={
            stage === "opening"
              ? { rotateY: -12, scale: 1.03 }
              : stage === "success"
              ? {
                  scale: 1.04,
                  boxShadow: "0 0 0 4px rgba(227,190,106,0.5), 0 30px 70px -15px rgba(212,168,67,0.5)",
                  opacity: 0,
                }
              : { rotateY: 0, scale: 1 }
          }
          transition={
            stage === "success"
              ? { duration: 0.9, ease: "easeInOut" }
              : { duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }
          }
          className={`diary-leather relative rounded-2xl px-6 sm:px-10 py-10 sm:py-14 text-center ${
            stage === "closed" ? "cursor-pointer" : ""
          }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Ribbon bookmark */}
          <div
            className="absolute top-0 right-8 w-5 h-16 bg-rose-300"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)" }}
            aria-hidden="true"
          />

          <p className="text-xs uppercase tracking-[0.2em] text-[#b8924f] font-medium mb-2">
            ✦ Private Diary ✦
          </p>

          <h1 className="gold-foil font-display text-3xl sm:text-4xl font-bold tracking-wide">
            The Diary
          </h1>

          <p className="handwriting text-rose-400 text-lg sm:text-xl mt-2">
            Our story, one movie at a time.
          </p>

          {/* Closed state hint */}
          <AnimatePresence>
            {stage === "closed" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 text-sm text-[#9e7a60] animate-pulse"
              >
                tap to open ✨
              </motion.p>
            )}
          </AnimatePresence>

          {/* Password form */}
          <AnimatePresence>
            {(stage === "open" || stage === "success") && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-8 space-y-4"
              >
                <p className="text-sm text-[#7a5c47] flex items-center justify-center gap-1.5">
                  <Lock size={14} className="text-[#b8924f]" />
                  This little diary keeps our memories safe.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoFocus
                    aria-label="Diary password"
                    disabled={stage === "success"}
                    className="w-full px-4 py-3 bg-white/80 border border-[#e8dcc8] rounded-xl text-center text-[#3d2b1f] placeholder:text-[#d4c4aa] tracking-widest focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition disabled:opacity-60"
                  />

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-rose-500"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={loading || !password || stage === "success"}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-xl font-semibold transition-colors shadow-md disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : stage === "success" ? (
                      "Welcome back 💕"
                    ) : (
                      <>
                        Open Our Diary <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-xs text-[#b8a090]">
                  Only You know the secret my Cutie!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="handwriting text-[#c99f7f] text-sm mt-8">
            Every movie became a memory.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}