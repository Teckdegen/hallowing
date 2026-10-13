"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/avatar";
import { CookieBanner } from "@/components/cookie-banner";
import { GhostWanderer } from "@/components/ghost-wanderer";
import { useTheme } from "@/components/theme";
import { fetchCreators, type CreatorSummary } from "@/lib/videos";

const nav = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/browse#creators", label: "Following", icon: "heart" },
  { href: "/create", label: "Upload a haunt", icon: "plus" },
  { href: "/leaderboard", label: "Leaderboard", icon: "cup" },
  { href: "/how-it-works", label: "How it works", icon: "info" },
] as const;

const ghostPages = new Set(["/", "/browse"]);

function PathEffect({ onChange }: { onChange: () => void }) {
  const pathname = usePathname();
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onChangeRef.current();
  }, [pathname]);
  return null;
}

function PageGhost() {
  const pathname = usePathname();
  return ghostPages.has(pathname) ? <GhostWanderer key={pathname} /> : null;
}

function CurrentNav({ onNavigate }: { onNavigate: () => void }) {
  return <NavLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-2" aria-label="Primary">
      {nav.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : item.label === "Following" ? pathname === "/browse" : pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={`flex h-10 items-center gap-3 px-3 text-sm ${
              active ? "bg-foreground/[0.06] text-foreground" : "text-muted hover:bg-foreground/5 hover:text-foreground"
            }`}
          >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const { user, ready, configured, displayName, avatarUrl, login, signOut, needsUsername, saveUsername } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeMenu = useCallback(() => setMobileOpen(false), []);

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
      <header className="sticky top-0 z-40 flex h-14 items-center gap-1 border-b border-line bg-background px-2 sm:gap-3 sm:px-3">
        {searchOpen ? (
          <div className="absolute inset-0 z-10 flex items-center gap-1 bg-background px-2 sm:hidden">
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="grid size-9 shrink-0 place-items-center rounded-full text-foreground hover:bg-foreground/5"
            >
              <BackIcon />
            </button>
            <SearchField id="site-search-mobile" autoFocus />
          </div>
        ) : null}
        <Link href="/" className="flex shrink-0 items-center gap-2 pl-1" aria-label="Hallowing">
          <img src="/ghost.png" alt="" width={256} height={256} data-ghost-home className="size-8 object-contain sm:size-9" />
          <span className="hidden text-lg font-semibold tracking-tight sm:inline">Hallowing</span>
        </Link>
        <div className="hidden min-w-0 flex-1 justify-center px-2 sm:flex">
          <SearchField id="site-search" />
        </div>
        <div className="flex-1 sm:hidden" />
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search videos"
            className="grid size-9 place-items-center rounded-full text-foreground hover:bg-foreground/5 sm:hidden"
          >
            <SearchIcon size={18} />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="grid size-9 place-items-center rounded-full text-foreground hover:bg-foreground/5"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          {ready && user ? (
            <>
              {user.username ? (
                <Link
                  href={`/creators/${user.username}`}
                  aria-label={`${displayName} profile`}
                  className="flex min-w-0 items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-foreground/5"
                >
                  <Avatar src={avatarUrl} seed={user.username ?? user.wallet ?? user.id} className="size-8" />
                  <span className="hidden max-w-28 truncate text-sm sm:block">{displayName}</span>
                </Link>
              ) : (
                <span className="flex min-w-0 items-center gap-2 py-1 pr-2 pl-1">
                  <Avatar src={avatarUrl} seed={user.username ?? user.wallet ?? user.id} className="size-8" />
                  <span className="hidden max-w-28 truncate text-sm sm:block">{displayName}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => void signOut()}
                className="h-9 rounded-full px-3 text-sm font-medium hover:bg-foreground/5"
              >
                Log out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => (configured ? login() : setSetupOpen(true))}
              className="h-9 rounded-full px-3 text-sm font-medium hover:bg-foreground/5"
            >
              Log in
            </button>
          )}
          <button
            type="button"
            onClick={toggleNav}
            aria-expanded={mobileOpen || !collapsed}
            aria-label="Menu"
            className="grid size-9 shrink-0 place-items-center rounded-full text-foreground hover:bg-foreground/5 sm:size-10"
          >
            <MenuIcon />
          </button>
        </div>
      </header>
      {needsUsername ? <UsernameModal onSave={saveUsername} /> : null}
      {setupOpen ? <SetupModal onClose={() => setSetupOpen(false)} /> : null}

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
          className={`${sidebarVisible} ${sidebarDesktop} fixed top-14 right-0 bottom-0 z-30 w-[232px] shrink-0 flex-col border-l border-line bg-background lg:sticky lg:right-auto lg:left-0 lg:border-r lg:border-l-0 lg:bottom-auto lg:h-[calc(100dvh-3.5rem)]`}
        >
          <Suspense fallback={<NavLinks pathname={null} onNavigate={closeMenu} />}>
            <CurrentNav onNavigate={closeMenu} />
          </Suspense>
          <SidebarRecommended onNavigate={closeMenu} />
          <div className="flex shrink-0 gap-4 border-t border-line px-4 py-3 text-xs text-muted">
            <Link href="/privacy" onClick={() => setMobileOpen(false)} className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" onClick={() => setMobileOpen(false)} className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <Suspense fallback={null}>
        <PageGhost />
        <PathEffect onChange={closeSearch} />
      </Suspense>
      <CookieBanner />
    </div>
  );
}

function SidebarRecommended({ onNavigate }: { onNavigate: () => void }) {
  const [creators, setCreators] = useState<CreatorSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchCreators("", 12).then((next) => {
      if (!cancelled) setCreators(next.filter((creator) => creator.videos > 0));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-2 flex min-h-0 flex-1 flex-col border-t border-line">
      <p className="px-4 pt-4 pb-2 text-xs font-semibold text-muted">Recommended</p>
      {creators.length === 0 ? <p className="px-4 text-xs text-faint">Creators show up here once they post.</p> : null}
      <ul className="chat-scroll min-h-0 flex-1 overflow-y-auto pb-4">
        {creators.map((creator) => (
          <li key={creator.username}>
            <Link
              href={`/creators/${creator.username}`}
              onClick={onNavigate}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-foreground/5"
            >
              <Avatar src={creator.avatar} seed={creator.username} className="size-8" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{creator.name}</span>
                <span className="block truncate text-xs text-muted">@{creator.username}</span>
              </span>
              <span className="shrink-0 text-xs text-muted tabular-nums">{creator.videos}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UsernameModal({ onSave }: { onSave: (username: string) => Promise<string | null> }) {
  const { user } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <div role="dialog" aria-modal="true" aria-labelledby="name-title" className="w-full max-w-sm rounded-3xl border border-line bg-card p-5">
        <h2 id="name-title" className="text-lg font-semibold">Choose a username</h2>
        <p className="mt-2 text-sm text-muted">This is your Hallowing name. Your character comes with it.</p>
        <form
          noValidate
          className="mt-4 flex flex-col items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (pending) return;
            const username = String(new FormData(event.currentTarget).get("username") ?? "");
            setPending(true);
            setNotice(null);
            void onSave(username).then((message) => {
              setPending(false);
              if (message) setNotice(message);
            });
          }}
        >
          <Avatar src={null} seed={draft || user?.wallet || user?.id || ""} alt="" className="size-20" />
          <input
            name="username"
            value={draft}
            onChange={(event) => setDraft(event.target.value.trim().replace(/^@/, ""))}
            required
            minLength={3}
            maxLength={20}
            placeholder="username"
            aria-invalid={notice ? true : undefined}
            className={`h-10 w-full rounded-full border bg-foreground/5 px-4 text-sm outline-none placeholder:text-faint ${notice ? "border-accent" : "border-line"}`}
          />
          {notice ? (
            <p className="text-sm text-accent" role="alert">
              {notice}
            </p>
          ) : null}
          <ActionButton type="submit" pending={pending} idle="Save" busy="Saving" className="h-10 w-full rounded-full bg-accent text-sm font-semibold text-[#1a0c08]" />
        </form>
      </div>
    </div>
  );
}

function SetupModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-title"
        className="w-full max-w-sm rounded-3xl border border-line bg-card p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="setup-title" className="text-lg font-semibold">Privy</h2>
        <p className="mt-3 text-sm text-muted">Add NEXT_PUBLIC_PRIVY_APP_ID to .env.local, then restart the app.</p>
        <button type="button" onClick={onClose} className="mt-4 h-10 w-full rounded-full bg-accent text-sm font-semibold text-[#1a0c08]">
          Close
        </button>
      </div>
    </div>
  );
}

function SearchField({ id, autoFocus = false }: { id: string; autoFocus?: boolean }) {
  return (
    <form action="/browse" className="relative w-full min-w-0 sm:max-w-sm lg:max-w-md">
      <label htmlFor={id} className="sr-only">
        Search videos
      </label>
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
        <SearchIcon />
      </span>
      <input
        id={id}
        name="q"
        type="search"
        autoFocus={autoFocus}
        placeholder="Search videos, creators, #tags"
        className="h-9 w-full rounded-full border border-line bg-card pr-4 pl-9 text-sm text-foreground outline-none placeholder:text-faint"
      />
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

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M12.6 3.4l-1.3 1.3M4.7 11.3l-1.3 1.3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path d="M9.2 1.8a5.6 5.6 0 1 0 5 7.6 4.6 4.6 0 0 1-5-7.6Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M11 3.5 5.5 9l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.2 10.2 13 13" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function NavIcon({ name }: { name: "home" | "heart" | "cup" | "plus" | "info" }) {
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
  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M7.1 2.2h1.8v4.9h4.9v1.8H8.9v4.9H7.1V8.9H2.2V7.1h4.9V2.2z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "info") {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="6.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 7.1V11.4" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8" cy="4.9" r="0.7" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M8 1.6 9.6 5.8h4.4L10.6 8.6 12 12.8 8 10.2 4 12.8l1.4-4.2L2 5.8h4.4L8 1.6z" fill="currentColor" />
    </svg>
  );
}
