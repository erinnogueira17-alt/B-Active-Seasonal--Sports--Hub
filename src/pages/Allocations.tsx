import { useMemo, useState } from "react";
import { trpc } from "../lib/trpc";
import { sportEmoji, type Term } from "../lib/utils";
import { EmptyState, Loading, PageContainer, PageHeader, TermTabs } from "../components/ui";

export function Allocations() {
  const [term, setTerm] = useState<Term>("term3");
  const query = trpc.allocations.listByTerm.useQuery({ term });

  const grouped = useMemo(() => {
    const map = new Map<string, typeof query.data>();
    for (const a of query.data ?? []) {
      const arr = map.get(a.school) ?? [];
      arr!.push(a);
      map.set(a.school, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [query.data]);

  return (
    <PageContainer>
      <PageHeader title="Coach Allocations" subtitle="Who's coaching what, grouped by school." />
      <TermTabs value={term} onChange={setTerm} />

      {query.isLoading ? (
        <Loading />
      ) : grouped.length === 0 ? (
        <EmptyState>No allocations for this term yet.</EmptyState>
      ) : (
        <div className="space-y-8">
          {grouped.map(([school, allocs]) => (
            <div key={school}>
              <h2 className="heading mb-3 text-xl text-neutral-800">{school}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {allocs!.map((a) => (
                  <div key={a.id} className="card flex items-center gap-3 p-4">
                    <span className="text-3xl">{sportEmoji(a.team)}</span>
                    <div>
                      <div className="font-semibold text-neutral-900">{a.team}</div>
                      <div className="text-sm text-neutral-500">{a.coachName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
