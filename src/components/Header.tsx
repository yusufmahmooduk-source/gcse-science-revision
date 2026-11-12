"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { setPrefs, useStore } from "@/lib/store";

const NAV = [
  { href: "/biology/", label: "Biology", cls: "theme-biology" },
  { href: "/chemistry/", label: "Chemistry", cls: "theme-chemistry" },
  { href: "/physics/", label: "Physics", cls: "theme-physics" },
  { href: "/practice/", label: "Practice" },
  { href: "/flashcards/", label: "Flashcards" },
  { href: "/practicals/", label: "Practicals" },
  { href: "/equations/", label: "Equations" },
  { href: "/mock/", label: "Mock exams" },
  { href: "/progress/", label: "Progress" },
];

export default function Header() {
  const path = usePathname();
  const s = useStore();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  useEffect(() => setOpen(false), [path]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 via-violet-500 to-blue-500 text-sm text-white">
            G
          </span>
          <span className="hidden sm:inline">GCSE Science</span>
        </Link>
        <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`${n.cls ?? ""} rounded-md px-2.5 py-1.5 text-sm hover:bg-accent-soft ${
                path?.startsWith(n.href) ? "bg-accent-soft font-semibold text-accent-fg" : "text-muted"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <select
            aria-label="Course"
            value={s.course}
            onChange={(e) => setPrefs({ course: e.target.value as "separate" | "combined" })}
            className="rounded-md border border-line bg-card px-2 py-1 text-sm"
          >
            <option value="separate">Separate sciences</option>
            <option value="combined">Combined Science</option>
          </select>
          <select
            aria-label="Tier"
            value={s.tier}
            onChange={(e) => setPrefs({ tier: e.target.value as "foundation" | "higher" })}
            className="rounded-md border border-line bg-card px-2 py-1 text-sm"
          >
            <option value="higher">Higher</option>
            <option value="foundation">Foundation</option>
          </select>
          <button onClick={toggleTheme} aria-label="Toggle dark mode" className="rounded-md border border-line px-2 py-1 text-sm">
            {dark ? "☀︎" : "☾"}
          </button>
          <button onClick={() => setOpen(!open)} className="rounded-md border border-line px-2 py-1 text-sm lg:hidden" aria-label="Menu">
            ☰
          </button>
        </div>
      </div>
      {open && (
        <nav className="grid grid-cols-2 gap-1 border-t border-line px-4 py-3 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-2 py-2 text-sm hover:bg-accent-soft">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
