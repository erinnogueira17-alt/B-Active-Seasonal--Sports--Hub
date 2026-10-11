import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "../components/Toast";
import { sportEmoji, type Term } from "../lib/utils";
import { EmptyState, Loading, PageContainer, PageHeader, TermTabs } from "../components/ui";

export function Allocations() {
  const [term, setTerm] = useState<Term>("term4");
  const { isAdmin } = useAuth();
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

      {isAdmin && <AddAllocation term={term} />}

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
                  <div key={a.id} className="card group flex items-center gap-3 p-4">
                    <span className="text-3xl">{sportEmoji(a.team)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-neutral-900">{a.team}</div>
                      <div className="text-sm text-neutral-500">{a.coachName}</div>
                    </div>
                    {isAdmin && <DeleteAllocation id={a.id} term={term} />}
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

function AddAllocation({ term }: { term: Term }) {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const schools = trpc.schools.list.useQuery();
  const [school, setSchool] = useState("");
  const [coachName, setCoachName] = useState("");
  const [sport, setSport] = useState("");

  const create = trpc.allocations.create.useMutation({
    onSuccess: () => {
      utils.allocations.listByTerm.invalidate({ term });
      setCoachName("");
      setSport("");
      toast("Allocation added");
    },
    onError: (e) => toast(e.message, "error"),
  });

  const termLabel = term.replace("term", "Term ");
  const canAdd = !!school.trim() && !!coachName.trim() && !!sport.trim() && !create.isPending;

  const submit = () => {
    if (!canAdd) return;
    create.mutate({ coachName: coachName.trim(), team: sport.trim(), school: school.trim(), term });
  };

  return (
    <div className="card mb-6 p-4">
      <div className="mb-3 heading text-sm text-neutral-500">Admin — add a coach allocation ({termLabel})</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="input"
          list="allocation-school-list"
          placeholder="School"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
        />
        <datalist id="allocation-school-list">
          {(schools.data ?? []).map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
        <input
          className="input"
          placeholder="Coach name"
          value={coachName}
          onChange={(e) => setCoachName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <input
          className="input"
          placeholder="Sport / activity"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <button className="btn-primary whitespace-nowrap" disabled={!canAdd} onClick={submit}>
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        Pick an existing school or type a new one. The allocation is added to <strong>{termLabel}</strong>.
      </p>
    </div>
  );
}

function DeleteAllocation({ id, term }: { id: number; term: Term }) {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const del = trpc.allocations.delete.useMutation({
    onSuccess: () => { utils.allocations.listByTerm.invalidate({ term }); toast("Allocation removed"); },
    onError: (e) => toast(e.message, "error"),
  });
  return (
    <button
      className="shrink-0 text-neutral-300 transition-colors hover:text-[#dc2626] group-hover:text-neutral-400"
      onClick={() => { if (confirm("Remove this allocation?")) del.mutate({ id }); }}
      aria-label="Remove allocation"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
