"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import type { DiaryEntry } from "@/types";
import { getYear, getMonthName, formatShortDate } from "@/lib/utils";

type Grouped = Record<string, Record<string, DiaryEntry[]>>;

export default function TimelinePage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/entries?sort=newest&limit=200")
      .then(r => r.json() as Promise<{ items: import("@/types").DiaryEntry[] }>)
      .then(d => setEntries(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Group by year → month
  const grouped: Grouped = {};
  for (const e of entries) {
    const year  = getYear(e.watched_date);
    const month = getMonthName(e.watched_date);
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = [];
    grouped[year][month].push(e);
  }

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));
  const MONTHS_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 animate-pulse space-y-8">
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div className="h-7 w-16 bg-[#e8dcc8] rounded mb-4" />
            <div className="space-y-3 pl-6">
              <div className="h-4 w-20 bg-[#e8dcc8] rounded" />
              <div className="h-16 bg-[#e8dcc8] rounded-xl" />
              <div className="h-16 bg-[#e8dcc8] rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold text-[#3d2b1f]">The Timeline</h1>
        <p className="handwriting text-rose-400 text-lg mt-1">a journey through every movie night 📅</p>
      </motion.div>

      {years.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📅</p>
          <p className="font-display text-xl text-[#3d2b1f]">No entries yet</p>
          <Link href="/add" className="inline-block mt-4 px-5 py-2.5 bg-rose-400 text-white rounded-xl text-sm font-medium hover:bg-rose-500 transition-colors">
            Add First Entry 💕
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {years.map((year, yi) => (
            <motion.div
              key={year}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: yi * 0.1 }}
            >
              {/* Year header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="font-display text-4xl font-bold text-[#3d2b1f] leading-none">{year}</div>
                <div className="flex-1 h-px bg-gradient-to-r from-[#e8dcc8] to-transparent" />
                <span className="text-xs text-[#9e7a60]">
                  {Object.values(grouped[year]).reduce((s, a) => s + a.length, 0)} films
                </span>
              </div>

              {/* Months */}
              <div className="space-y-6">
                {MONTHS_ORDER
                  .filter(m => grouped[year][m])
                  .map((month, mi) => (
                    <div key={month}>
                      {/* Month label */}
                      <div className="flex items-center gap-2 mb-3 pl-2">
                        <div className="w-2 h-2 rounded-full bg-rose-300" />
                        <h3 className="text-sm font-semibold text-[#7a5c47] uppercase tracking-wide">{month}</h3>
                        <span className="text-xs text-[#b8a090]">{grouped[year][month].length} film{grouped[year][month].length !== 1 ? "s" : ""}</span>
                      </div>

                      {/* Entries for this month */}
                      <div className="pl-6 space-y-2.5 border-l-2 border-[#f0e6d2]">
                        {grouped[year][month].map((entry, ei) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: yi * 0.1 + mi * 0.05 + ei * 0.03 }}
                          >
                            <Link href={`/entries/${entry.id}`} className="block">
                              <div className="diary-card flex items-center gap-3 px-4 py-3">
                                {entry.poster_url && (
                                  <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 shadow-sm">
                                    <Image
                                      src={entry.poster_url}
                                      alt={entry.title ?? ""}
                                      width={40}
                                      height={56}
                                      className="w-full h-full object-cover"
                                      unoptimized
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-display font-semibold text-[#3d2b1f] text-sm truncate">{entry.title}</p>
                                  <p className="text-xs text-[#9e7a60]">{formatShortDate(entry.watched_date)}</p>
                                </div>
                                {entry.your_rating && (
                                  <span className="text-xs text-amber-500 font-medium flex-shrink-0">
                                    {"★".repeat(entry.your_rating)}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
