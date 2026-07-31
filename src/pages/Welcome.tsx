import { Link } from "wouter";
import { ArrowLeft, Target, Flag, Award, Phone, Mail, User } from "lucide-react";

const CONTACTS = [
  {
    name: "Sandiso",
    role: "Manager",
    tag: "Primary Contact",
    primary: true,
    phone: "071 325 0064",
    email: "sandiso@bactivegroup.com",
    note: null as string | null,
  },
  {
    name: "Emmanuel",
    role: "Manager",
    tag: "Secondary Contact",
    primary: false,
    phone: "069 179 9845",
    email: "emmanuel@bactivegroup.com",
    note: "Contact Emmanuel if Sandiso is unavailable",
  },
];

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Target;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center gap-3">
        <Icon className="h-6 w-6 text-[#f59e0b]" />
        <h2 className="heading text-xl text-[#f59e0b]">{title}</h2>
      </div>
      <div className="rounded-xl border-l-4 border-[#f59e0b] bg-white p-6 text-neutral-700 shadow-sm">
        {children}
      </div>
    </div>
  );
}

export function Welcome() {
  return (
    <div>
      {/* Black header band */}
      <div className="border-b-2 border-[#f59e0b] bg-neutral-950 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-[#f59e0b] hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <h1 className="heading text-4xl text-[#f59e0b]">About Seasonal Sports</h1>
          <p className="mt-1 text-white/70">Professional Sports Coaching Excellence</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-xl bg-white p-6 text-neutral-800 shadow-sm">
          Seasonal Sports is a service offered by The B-Active Group to schools seeking to
          outsource professional sports coaching.
        </div>

        <Section icon={Target} title="VISION">
          To be the leading provider of highly qualified coaches who deliver a professional,
          enriching, and impactful sports experience—elevating both the students' development and
          the value we bring to every school we serve.
        </Section>

        <Section icon={Flag} title="MISSION">
          To deliver focused, high-quality coaching through our Seasonal Sports program—empowering
          coaches to specialize in a specific sport each term, aligned with each school's unique
          preferences and needs.
        </Section>

        <Section icon={Award} title="EXCELLENCE">
          Being part of a school's competitive team is both an honor and a responsibility. The
          schools place their trust in us to guide their teams, and in turn, we trust our B-Active
          Coaches to lead with excellence in this dynamic environment.
        </Section>

        <Section icon={Phone} title="CONTACT US">
          <p className="mb-4">
            For all inquiries regarding Seasonal Sports, please contact our management team:
          </p>
          <div className="space-y-4">
            {CONTACTS.map((c) => (
              <div
                key={c.name}
                className={
                  "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center " +
                  (c.primary ? "border-[#f59e0b] bg-[#f59e0b]/5" : "border-neutral-200")
                }
              >
                <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-neutral-200 text-neutral-500">
                  <User className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-neutral-900">{c.name}</span>
                    <span
                      className={
                        "badge " +
                        (c.primary ? "bg-[#f59e0b] text-black" : "bg-neutral-200 text-neutral-600")
                      }
                    >
                      {c.tag}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-500">{c.role}</div>
                  <div className="mt-1 space-y-0.5 text-sm">
                    <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-[#b45309] hover:underline">
                      <Phone className="h-4 w-4" /> {c.phone}
                    </a>
                    <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-[#b45309] hover:underline">
                      <Mail className="h-4 w-4" /> {c.email}
                    </a>
                  </div>
                  {c.note && <p className="mt-1 text-xs italic text-neutral-500">{c.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
