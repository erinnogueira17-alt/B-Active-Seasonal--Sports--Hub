import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "../components/Toast";
import { TERMS, type Term } from "../lib/utils";
import { EmptyState, Loading, Modal, PageContainer, PageHeader, TermTabs } from "../components/ui";

export function Log() {
  const [term, setTerm] = useState<Term>("term3");
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const query = trpc.liveLog.list.useQuery({ term });

  const [name, setName] = useState("");
  const [points, setPoints] = useState("0");
  const [editing, setEditing] = useState<{ id: number; name: string; points: number } | null>(null);

  const invalidate = () => utils.liveLog.list.invalidate({ term });

  const upsert = trpc.liveLog.upsert.useMutation({
    onSuccess: () => { invalidate(); setName(""); setPoints("0"); toast("Leaderboard updated"); },
    onError: (e) => toast(e.message, "error"),
  });
  const update = trpc.liveLog.update.useMutation({
    onSuccess: () => { invalidate(); setEditing(null); toast("Entry updated"); },
    onError: (e) => toast(e.message, "error"),
  });
  const del = trpc.liveLog.delete.useMutation({
    onSuccess: () => { invalidate(); toast("Entry removed"); },
    onError: (e) => toast(e.message, "error"),
  });
  const [cotw, setCotw] = useState("");
  const coachOfWeek = trpc.liveLog.coachOfWeek.useMutation({
    onSuccess: () => { invalidate(); setCotw(""); toast("Coach of the Week — +3 points awarded"); },
    onError: (e) => toast(e.message, "error"),
  });

  const termLabel = TERMS.find((t) => t.value === term)?.label ?? term;

  return (
    <PageContainer>
      <PageHeader title="Seasonal Log" subtitle="The live points leaderboard for the term." />
      <TermTabs value={term} onChange={setTerm} />

      {isAdmin && (
        <div className="card mb-6 p-4">
          <div className="mb-3 heading text-sm text-neutral-500">Admin — add / update entry</div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="label">Coach name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="w-28">
              <label className="label">Points</label>
              <input className="input" type="number" value={points} onChange={(e) => setPoints(e.target.value)} />
            </div>
            <button
              className="btn-primary"
              disabled={!name || upsert.isPending}
              onClick={() => upsert.mutate({ entityName: name, points: Number(points), term })}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="card mb-6 border-l-4 border-[#f59e0b] p-4">
          <div className="mb-3 heading text-sm text-neutral-500">⭐ Coach of the Week — adds +3 points</div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="label">Choose a coach</label>
              <select className="input" value={cotw} onChange={(e) => setCotw(e.target.value)}>
                <option value="">Select a coach…</option>
                {(query.data ?? []).map((row) => (
                  <option key={row.id} value={row.entityName}>{row.entityName}</option>
                ))}
              </select>
            </div>
            <button
              className="btn-gold"
              disabled={!cotw || coachOfWeek.isPending}
              onClick={() => { if (confirm(`Award Coach of the Week (+3) to ${cotw}?`)) coachOfWeek.mutate({ entityName: cotw, term }); }}
            >
              Award +3
            </button>
          </div>
        </div>
      )}

      {query.isLoading ? (
        <Loading />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState>{termLabel} log is starting — check back after the first submissions.</EmptyState>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-950 text-white">
              <tr>
                <th className="px-4 py-3 w-16">Rank</th>
                <th className="px-4 py-3">Coach</th>
                <th className="px-4 py-3 w-24 text-right">Points</th>
                {isAdmin && <th className="px-4 py-3 w-24"></th>}
              </tr>
            </thead>
            <tbody>
              {query.data!.map((row, i) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-bold text-[#f59e0b]">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{row.entityName}</td>
                  <td className="px-4 py-3 text-right font-bold">{row.points}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button className="text-neutral-500 hover:text-[#dc2626]"
                          onClick={() => setEditing({ id: row.id, name: row.entityName, points: row.points })}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="text-neutral-500 hover:text-[#dc2626]"
                          onClick={() => { if (confirm(`Delete ${row.entityName}?`)) del.mutate({ id: row.id }); }}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit entry">
        {editing && (
          <div className="space-y-3">
            <div>
              <label className="label">Coach name</label>
              <input className="input" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Points</label>
              <input className="input" type="number" value={editing.points}
                onChange={(e) => setEditing({ ...editing, points: Number(e.target.value) })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={update.isPending}
                onClick={() => update.mutate({ id: editing.id, entityName: editing.name, points: editing.points })}>
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
