import { Link } from "wouter";
import { Users, Trophy, ScrollText, ClipboardList, BookOpen, Calendar, TrendingUp, Camera, LifeBuoy } from "lucide-react";
import { useAuth } from "../lib/useAuth";
import { AdminOnly } from "../components/Guards";
import { PageContainer } from "../components/ui";

const CARDS = [
  { title: "Manage Coaches", icon: Users, href: "/manage-coaches" },
  { title: "Results & Reports", icon: Trophy, href: "/results" },
  { title: "Seasonal Log", icon: ScrollText, href: "/log" },
  { title: "Allocations", icon: ClipboardList, href: "/allocations" },
  { title: "Manage Resources", icon: BookOpen, href: "/manage-resources" },
  { title: "Manage Calendar", icon: Calendar, href: "/manage-events" },
  { title: "Planner Analytics", icon: TrendingUp, href: "/planner-analytics" },
  { title: "Gallery", icon: Camera, href: "/gallery" },
  { title: "Term Maintenance Guide", icon: LifeBuoy, href: "/maintenance-guide" },
];

export function AdminDashboard() {
  return (
    <AdminOnly>
      <Inner />
    </AdminOnly>
  );
}

function Inner() {
  const { user } = useAuth();
  return (
    <PageContainer>
      <div className="mb-8 rounded-xl bg-neutral-950 p-8 text-white">
        <h1 className="heading text-3xl">Welcome to the Admin Panel</h1>
        <p className="mt-2 text-white/70">
          {user?.name ? `Signed in as ${user.name}. ` : ""}Term 3 is active.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="card group flex flex-col items-center gap-3 p-6 text-center transition-shadow hover:shadow-md">
            <c.icon className="h-9 w-9 text-[#dc2626]" />
            <span className="font-semibold group-hover:text-[#dc2626]">{c.title}</span>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
