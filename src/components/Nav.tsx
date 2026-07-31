import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ShieldCheck } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "./Toast";
import { cn } from "../lib/utils";

const PUBLIC_LINKS = [
  ["/welcome", "About"],
  ["/allocations", "Allocations"],
  ["/results", "Results"],
  ["/log", "Log"],
  ["/gallery", "Gallery"],
  ["/resources", "Resources"],
  ["/tutorial", "Help"],
];

const ADMIN_LINKS = [
  ["/manage-events", "Calendar"],
  ["/manage-resources", "Resources+"],
  ["/manage-coaches", "Coaches"],
  ["/manage-accounts", "Team"],
  ["/planner-analytics", "Analytics"],
  ["/maintenance-guide", "Guide"],
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { isAdmin, isAuthed, refetch } = useAuth();
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      await refetch();
      toast("Signed out");
    },
  });

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className={cn(
        "rounded px-3 py-2 text-sm font-medium transition-colors",
        location === href ? "text-[#f59e0b]" : "text-white/90 hover:text-[#f59e0b]",
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="no-print sticky top-0 z-40 border-b-2 border-[#f59e0b] bg-neutral-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img
            src="/logo.jpg"
            alt="B-Active"
            className="h-9 w-9 rounded object-cover"
            onError={(e) => {
              const t = e.currentTarget;
              t.onerror = null;
              t.src = "/logo.svg";
            }}
          />
          <span className="heading hidden text-white sm:block">Seasonal Sports Hub</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {PUBLIC_LINKS.map(([href, label]) => (
            <NavLink key={href} href={href} label={label} />
          ))}
          {isAdmin && ADMIN_LINKS.map(([href, label]) => <NavLink key={href} href={href} label={label} />)}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isAdmin && (
            <Link href="/admin" className="badge bg-[#f59e0b] px-3 py-1.5 text-black hover:bg-yellow-400">
              <ShieldCheck className="mr-1 h-4 w-4" /> Admin Panel
            </Link>
          )}
          {isAuthed ? (
            <button className="btn-ghost text-white/80 hover:bg-white/10" onClick={() => logout.mutate()}>
              Sign out
            </button>
          ) : (
            <Link href="/login" className="btn-gold">
              Sign in
            </Link>
          )}
        </div>

        <button className="text-white lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-neutral-950 px-4 pb-4 lg:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {PUBLIC_LINKS.map(([href, label]) => (
              <NavLink key={href} href={href} label={label} />
            ))}
            {isAdmin && (
              <>
                <div className="mt-2 px-3 text-xs uppercase text-white/40">Admin</div>
                <NavLink href="/admin" label="Admin Panel" />
                {ADMIN_LINKS.map(([href, label]) => (
                  <NavLink key={href} href={href} label={label} />
                ))}
              </>
            )}
            <div className="mt-2">
              {isAuthed ? (
                <button className="btn-outline w-full" onClick={() => logout.mutate()}>
                  Sign out
                </button>
              ) : (
                <Link href="/login" className="btn-gold w-full" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
