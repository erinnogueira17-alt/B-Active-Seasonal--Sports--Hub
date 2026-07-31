import { Link } from "wouter";
import { Trophy, ClipboardList, BookOpen, ScrollText, Camera, Eye, EyeOff } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "../components/Toast";
import { EventsCalendar } from "../components/EventsCalendar";
import { PageContainer } from "../components/ui";

const FEATURES = [
  { href: "/results", icon: Trophy, title: "Weekly Results", desc: "Submit and review match results across every school." },
  { href: "/allocations", icon: ClipboardList, title: "Coach Allocations", desc: "See who's coaching what, this term." },
  { href: "/resources", icon: BookOpen, title: "Resources", desc: "Coaching guides and refereeing material by sport." },
  { href: "/log", icon: ScrollText, title: "Seasonal Log", desc: "The live points leaderboard for the term." },
  { href: "/gallery", icon: Camera, title: "Gallery", desc: "Photos from sessions, fixtures and festivals." },
];

export function Home() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const calendarVisible = trpc.settings.getCalendarVisible.useQuery();
  const eventsQuery = trpc.events.list.useQuery(undefined, {
    enabled: calendarVisible.data?.visible || isAdmin,
  });
  const setVisible = trpc.settings.setCalendarVisible.useMutation({
    onSuccess: async () => {
      await utils.settings.getCalendarVisible.invalidate();
      toast("Calendar visibility updated");
    },
  });

  const showCalendar = calendarVisible.data?.visible || isAdmin;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=60')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/40" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center md:py-32">
          <h1 className="heading text-4xl leading-tight md:text-6xl">Seasonal Sports Hub</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg italic text-white/80">
            “Great things in sport are never done by one person — they're done by a team.”
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/results" className="btn-primary px-6 py-3 text-base">Submit Results</Link>
            <Link href="/allocations" className="btn-gold px-6 py-3 text-base">View Allocations</Link>
            <Link
              href="/submit-planner"
              className="btn px-6 py-3 text-base border border-white text-white hover:bg-white hover:text-black"
            >
              Submit Planner
            </Link>
          </div>
        </div>
      </section>

      <PageContainer>
        {/* Feature cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className="card group p-6 transition-shadow hover:shadow-md">
              <f.icon className="h-9 w-9 text-[#dc2626]" />
              <h3 className="heading mt-3 text-lg group-hover:text-[#dc2626]">{f.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{f.desc}</p>
            </Link>
          ))}
        </div>

        {/* Events calendar */}
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="heading text-2xl">Events Calendar</h2>
            {isAdmin && (
              <button
                className="btn-outline"
                onClick={() => setVisible.mutate({ visible: !calendarVisible.data?.visible })}
                disabled={setVisible.isPending}
              >
                {calendarVisible.data?.visible ? (
                  <><EyeOff className="h-4 w-4" /> Hide from public</>
                ) : (
                  <><Eye className="h-4 w-4" /> Show to public</>
                )}
              </button>
            )}
          </div>
          {showCalendar ? (
            <EventsCalendar events={eventsQuery.data ?? []} />
          ) : (
            <div className="card p-8 text-center text-neutral-500">
              The events calendar is currently hidden.
            </div>
          )}
          {isAdmin && !calendarVisible.data?.visible && (
            <p className="mt-2 text-xs text-neutral-500">
              You can see this because you're an admin. The public cannot see it until you enable it.
            </p>
          )}
        </section>
      </PageContainer>
    </div>
  );
}
