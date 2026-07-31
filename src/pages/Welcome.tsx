import { Link } from "wouter";
import { PageContainer, PageHeader } from "../components/ui";

export function Welcome() {
  return (
    <PageContainer>
      <PageHeader
        title="Welcome, Coaches"
        subtitle="Everything you need for the season, in one place."
      />
      <div className="prose max-w-none text-neutral-700">
        <p>
          The Seasonal Sports Hub is the home base for The B-Active Group coaching
          programme. Here you can view your allocations, submit weekly match results,
          track the leaderboard, submit your seasonal planner each week, browse
          coaching resources, and share photos from your sessions.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>Check your <Link href="/allocations" className="text-[#dc2626] underline">allocations</Link> at the start of each term.</li>
          <li>Submit your <Link href="/submit-planner" className="text-[#dc2626] underline">weekly planner</Link> every Sunday/Monday to earn points.</li>
          <li>Log your <Link href="/results" className="text-[#dc2626] underline">match results</Link> after each fixture.</li>
          <li>Watch your ranking climb on the <Link href="/log" className="text-[#dc2626] underline">seasonal log</Link>.</li>
        </ul>
        <p className="mt-4">
          New here? Head to the <Link href="/tutorial" className="text-[#dc2626] underline">Help &amp; Tutorial</Link> page for a full walkthrough.
        </p>
      </div>
    </PageContainer>
  );
}
