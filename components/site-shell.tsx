"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getCreator, liveStreams } from "@/lib/data";
import { formatCompact } from "@/lib/format";

const nav = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/browse#creators", label: "Following", icon: "heart" },
  { href: "/leaderboard", label: "Leaderboard", icon: "cup" },
] as const;

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function toggleNav() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((value) => !value);
      return;
    }
    setMobileOpen((value) => !value);
  }

  const sidebarVisible = mobileOpen ? "flex" : "hidden";
  const sidebarDesktop = collapsed ? "lg:hidden" : "lg:flex";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-line bg-background px-2 sm:gap-3 sm:px-3">
        <button
          type="button"
          onClick={toggleNav}
          aria-expanded={mobileOpen || !collapsed}
          aria-label="Menu"
          className="grid size-10 shrink-0 place-items-center text-foreground hover:bg-[#1a1a1a]"
        >
          <MenuIcon />
        </button>
        <Link href="/" className="shrink-0 text-base font-black tracking-tight text-accent sm:text-lg">
          HALLOWING
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <SearchField id="site-search" />
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="h-9 rounded-full px-3 text-sm font-medium hover:bg-[#1a1a1a]"
          >
            Log in
          </button>
        </div>
      </header>
      {authOpen ? <AuthModal onClose={() => setAuthOpen(false)} /> : null}

      <div className="flex min-h-0 flex-1">
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 top-14 z-30 bg-black/70 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <aside
          className={`${sidebarVisible} ${sidebarDesktop} fixed top-14 bottom-0 left-0 z-30 w-[232px] shrink-0 flex-col border-r border-line bg-background lg:sticky lg:bottom-auto lg:h-[calc(100dvh-3.5rem)]`}
        >
          <nav className="flex flex-col gap-1 p-2" aria-label="Primary">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : item.label === "Following"
                    ? pathname === "/browse"
                    : pathname === "/leaderboard";
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`flex h-10 items-center gap-3 px-3 text-sm ${
                    active ? "bg-[#242424] text-foreground" : "text-muted hover:bg-[#161616] hover:text-foreground"
                  }`}
                >
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <SidebarRecommended onNavigate={() => setMobileOpen(false)} />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function SidebarRecommended({ onNavigate }: { onNavigate: () => void }) {
  const live = [...liveStreams()].sort((a, b) => b.viewers - a.viewers);

  return (
    <div className="mt-2 flex min-h-0 flex-1 flex-col border-t border-line">
      <p className="px-4 pt-4 pb-2 text-xs font-semibold text-muted">Recommended</p>
      <ul className="chat-scroll min-h-0 flex-1 overflow-y-auto pb-4">
        {live.map((stream) => {
          const creator = getCreator(stream.handle);
          if (!creator) return null;
          return (
            <li key={stream.slug}>
              <Link
                href={`/watch/${stream.slug}`}
                onClick={onNavigate}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#161616]"
              >
                <CreatorMark handle={creator.handle} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{creator.name}</span>
                  <span className="block truncate text-xs text-muted">{stream.title}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-accent tabular-nums">
                  {formatCompact(stream.viewers)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const login = mode === "login";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="w-full max-w-sm rounded-3xl border border-line bg-[#111] p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="auth-title" className="text-lg font-semibold">
          {login ? "Log in" : "Sign up"}
        </h2>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onClose();
          }}
        >
          {login ? null : (
            <input
              name="name"
              required
              placeholder="Name"
              className="h-10 rounded-full bg-[#1a1a1a] px-4 text-sm outline-none placeholder:text-faint"
            />
          )}
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="h-10 rounded-full bg-[#1a1a1a] px-4 text-sm outline-none placeholder:text-faint"
          />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Password"
            className="h-10 rounded-full bg-[#1a1a1a] px-4 text-sm outline-none placeholder:text-faint"
          />
          <button type="submit" className="mt-1 h-10 rounded-full bg-accent text-sm font-semibold text-[#1a0c08]">
            {login ? "Log in" : "Create account"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode(login ? "signup" : "login")}
          className="mt-4 w-full text-sm text-muted hover:text-foreground"
        >
          {login ? "New here? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}

function SearchField({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <form action="/browse" className={`relative ${open ? "w-[min(68vw,22rem)]" : "w-10"} transition-[width] duration-200`}>
      {open ? (
        <>
          <label htmlFor={id} className="sr-only">
            Search
          </label>
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-accent">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            id={id}
            name="q"
            type="search"
            placeholder="Say something"
            onBlur={(event) => {
              if (!event.currentTarget.value.trim()) setOpen(false);
            }}
            className="h-10 w-full rounded-full border border-accent bg-[#1a1a1a] pr-4 pl-10 text-sm text-foreground shadow-[0_0_0_3px_rgba(232,120,58,0.45)] outline-none placeholder:text-accent"
          />
        </>
      ) : (
        <button
          type="button"
          aria-label="Search"
          onClick={() => setOpen(true)}
          className="grid size-10 place-items-center rounded-full bg-[#1a1a1a] text-foreground hover:bg-[#242424]"
        >
          <SearchIcon />
        </button>
      )}
    </form>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.2 10.2 13 13" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function NavIcon({ name }: { name: "home" | "heart" | "cup" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 16 16", "aria-hidden": true as const, className: "shrink-0" };
  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M1.6 7.2 8 2.2l6.4 5V14H10v-4H6v4H1.6V7.2z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "heart") {
    return (
      <svg {...common}>
        <path d="M8 13.4 2.4 8.1A3.3 3.3 0 0 1 8 3.8a3.3 3.3 0 0 1 5.6 4.3L8 13.4z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M8 1.6 9.6 5.8h4.4L10.6 8.6 12 12.8 8 10.2 4 12.8l1.4-4.2L2 5.8h4.4L8 1.6z" fill="currentColor" />
    </svg>
  );
}

const creatorMarks: Record<string, { color: string; glyph: "house" | "cam" | "book" | "bulb" | "pin" | "wave" | "film" | "pad" | "mic" | "mask" | "file" }> = {
  nightmarehouse: { color: "#3b82f6", glyph: "house" },
  ghostcam: { color: "#a855f7", glyph: "cam" },
  cryptkeeper: { color: "#eab308", glyph: "book" },
  darkroom: { color: "#f97316", glyph: "bulb" },
  scaresquad: { color: "#22c55e", glyph: "pin" },
  hollowstatic: { color: "#14b8a6", glyph: "wave" },
  marrow: { color: "#e11d48", glyph: "film" },
  ashcache: { color: "#6366f1", glyph: "pad" },
  redporch: { color: "#f43f5e", glyph: "mic" },
  vesper: { color: "#8b5cf6", glyph: "mask" },
  lowsignal: { color: "#64748b", glyph: "file" },
};

function CreatorMark({ handle }: { handle: string }) {
  const mark = creatorMarks[handle] ?? { color: "#3b82f6", glyph: "house" as const };
  return (
    <span
      className="grid size-8 shrink-0 place-items-center rounded-full text-white"
      style={{ background: mark.color }}
      aria-hidden
    >
      <MarkGlyph name={mark.glyph} />
    </span>
  );
}

function MarkGlyph({ name }: { name: (typeof creatorMarks)[string]["glyph"] }) {
  if (name === "cam") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <rect x="1.5" y="3.5" width="7" height="7" rx="1" fill="currentColor" />
        <path d="M9 6.2 12.5 4.5v5L9 7.8V6.2z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "book") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <path d="M2 2.5h4.2c.7 0 1.3.6 1.3 1.3V12c-.6-.4-1.2-.6-1.8-.6H2V2.5zm10 0H7.8c-.6 0-1.2.2-1.8.6v8.2c.6-.4 1.2-.6 1.8-.6H12V2.5z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "bulb") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <path d="M7 1.5a3.8 3.8 0 0 0-2 7v1.2h4V8.5A3.8 3.8 0 0 0 7 1.5zM5.4 11h3.2v1.2H5.4V11z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "pin") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <path d="M7 1.4a3.2 3.2 0 0 0-3.2 3.2C3.8 7.4 7 12.6 7 12.6s3.2-5.2 3.2-8A3.2 3.2 0 0 0 7 1.4zm0 4.3a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "wave") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <path d="M1.5 8.5c1.2-2 2.2-2 3.2 0s2 2 3.2 0 2-2 3.2 0" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1.5 5c1.2-2 2.2-2 3.2 0s2 2 3.2 0 2-2 3.2 0" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (name === "film") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <rect x="1.5" y="2.5" width="11" height="9" rx="1" fill="currentColor" />
      </svg>
    );
  }
  if (name === "pad") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <rect x="1.5" y="4" width="11" height="6.5" rx="2" fill="currentColor" />
      </svg>
    );
  }
  if (name === "mic") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <rect x="5" y="1.5" width="4" height="6.5" rx="2" fill="currentColor" />
        <path d="M3.5 6.5a3.5 3.5 0 0 0 7 0M7 10v2.2" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    );
  }
  if (name === "mask") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <path d="M2 4.5c2-1.5 8-1.5 10 0 0 4.2-2 7-5 7s-5-2.8-5-7z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "file") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <path d="M3.5 1.5h4.2L11 5v7.5H3.5v-11z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path d="M1.6 6.4 7 2.2l5.4 4.2V12H8.6V8.2H5.4V12H1.6V6.4z" fill="currentColor" />
    </svg>
  );
}
