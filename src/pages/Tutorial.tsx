import { PageContainer, PageHeader } from "../components/ui";

const STEPS = [
  {
    title: "1. Find your allocations",
    body: "Open the Allocations page and select the current term. Allocations are grouped by school, showing the team/age group and sport for each coach.",
  },
  {
    title: "2. Submit your weekly planner",
    body: "Every Sunday and Monday the planner window opens. Pick your name, paste your planner link, and submit. Your first submission each week earns +2 points.",
  },
  {
    title: "3. Log match results",
    body: "After a fixture, go to Results and fill in the form: coach, sport, school/team, opposition, score and any feedback. Results feed the weekly reports.",
  },
  {
    title: "4. Track the leaderboard",
    body: "The Seasonal Log shows every coach's points for the term, ranked highest first. Points come from planner submissions and admin awards.",
  },
  {
    title: "5. Use resources & gallery",
    body: "Browse coaching guides and refereeing material by sport in Resources. Share and download session photos in the Gallery.",
  },
];

export function Tutorial() {
  return (
    <PageContainer>
      <PageHeader title="Help & Tutorial" subtitle="How to get the most out of the Seasonal Sports Hub." />
      <div className="space-y-4">
        {STEPS.map((s) => (
          <div key={s.title} className="card p-6">
            <h3 className="heading text-lg text-[#dc2626]">{s.title}</h3>
            <p className="mt-2 text-neutral-700">{s.body}</p>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
