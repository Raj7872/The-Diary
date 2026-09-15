"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Film, BookOpen, BarChart2, Clock, Plus, LogOut, ImagesIcon, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/home",     label: "Home",     icon: Film },
  { href: "/entries",  label: "Diary",    icon: BookOpen },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/stats",    label: "Stats",    icon: BarChart2 },
  { href: "/album",    label: "Album",    icon: ImagesIcon }
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex items-center justify-between px-8 py-4 bg-[#fffdf7] border-b border-[#e8dcc8] sticky top-0 z-50 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎬</span>
          <span className="font-display text-xl font-semibold text-[#3d2b1f]">The Diary</span>
          <span className="handwriting text-rose-400 text-lg ml-1">💕</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-rose-100 text-rose-600"
                  : "text-[#7a5c47] hover:bg-cream-100 hover:text-[#3d2b1f]"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
            <Link
            href="/add"
            className="ml-3 flex items-center gap-1.5 px-4 py-2 bg-rose-400 text-white rounded-lg text-sm font-medium hover:bg-rose-500 transition-colors shadow-sm"
          >
            <Plus size={15} />
            Add Entry
          </Link>
                    <Link
            href="/settings"
            title="Settings"
            className={cn(
              "p-2 rounded-lg transition-colors",
              pathname === "/settings"
                ? "bg-rose-100 text-rose-600"
                : "text-[#9e7a60] hover:bg-rose-50 hover:text-rose-500"
            )}
          >
            <Settings size={16} />
          </Link>
          <button
            onClick={handleLogout}
            title="Lock the diary"
            className="ml-1 p-2 rounded-lg text-[#9e7a60] hover:bg-rose-50 hover:text-rose-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#fffdf7] border-t border-[#e8dcc8] flex items-center justify-around px-2 py-2 shadow-[0_-2px_10px_rgba(61,43,31,0.08)]">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors",
              pathname === href ? "text-rose-500" : "text-[#9e7a60]"
            )}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
            <Link
          href="/add"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs text-rose-500"
        >
          <Plus size={20} />
          <span>Add</span>
        </Link>
                <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors",
            pathname === "/settings" ? "text-rose-500" : "text-[#9e7a60]"
          )}
        >
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs text-[#9e7a60]"
        >
          <LogOut size={20} />
          <span>Lock</span>
        </button>
      </nav>
    </>
  );
}
