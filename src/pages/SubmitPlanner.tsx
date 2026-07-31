import { useState } from "react";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "../components/Toast";
import { getWindowStatus, submissionWeekDate } from "../lib/plannerWindow";
import { formatDate, type Term } from "../lib/utils";
import { Loading, PageContainer, PageHeader } from "../components/ui";

// ─── Season / window controls ───────────────────────────────
// Master switch: set to false at the end of a season, true at the start.
const SEASON_OPEN = true;
// Earliest date the weekly window can open. Update at the start of each term.
const TERM_START = new Date(2026, 6, 1); // 1 July 2026

// The active term for planner submissions. Update at the start of each term.
function getCurrentTerm(): Term {
  return "term3";
}

export function SubmitPlanner() {
  const currentTerm = getCurrentTerm();
  const status = getWindowStatus(new Date(), SEASON_OPEN, TERM_START);
  const { isAdmin } = useAuth();

  return (
    <PageContainer>
      <PageHeader title="Submit Weekly Planner" subtitle="Submit your seasonal plan link each week to earn points." />

      {status.state === "season_ended" && (
        <Banner tone="muted">The season has ended. Planner submissions are closed.</Banner>
      )}
      {status.state === "not_started" && (
        <Banner tone="muted">The term hasn't started yet. The window opens from {formatDate(status.termStart)}.</Banner>
      )}
      {status.state === "closed" && (
        <Banner tone="muted">The submission window is closed. The next window opens Sunday {formatDate(status.nextSunday)}.</Banner>
      )}
      {status.state === "open" && (
        <SubmitFormCard term={currentTerm} weekDate={submissionWeekDate(status)} sunday={status.sunday} monday={status.monday} />
      )}

      {isAdmin && <ManageCoachesPanel term={currentTerm} />}
    </PageContainer>
  );
}

function Banner({ tone, children }: { tone: "muted" | "ok"; children: React.ReactNode }) {
  return (
    <div className={"card p-6 text-center " + (tone === "muted" ? "text-neutral-600" : "text-green-700")}>
      {children}
    </div>
  );
}

function SubmitFormCard({ term, weekDate, sunday, monday }: { term: Term; weekDate: Date; sunday: Date; monday: Date }) {
  const { toast } = useToast();
  const coaches = trpc.coaches.list.useQuery({ term });
  const [coachName, setCoachName] = useState("");
  const [plannerUrl, setPlannerUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const submit = trpc.planner.submit.useMutation({
    onSuccess: (res) => {
      setResult(res.awarded ? "✅ Submitted! +2 points awarded" : "✅ Updated — no additional points (already submitted this week)");
      setPlannerUrl("");
      toast(res.awarded ? "+2 points awarded!" : "Planner updated");
    },
    onError: (e) => toast(e.message, "error"),
  });

  return (
    <div className="card p-6">
      <div className="mb-4 rounded-lg bg-[#f59e0b]/15 px-4 py-3 text-sm text-[#92400e]">
        Window open for the week of <strong>{formatDate(monday)}</strong> (Sun {formatDate(sunday)} / Mon {formatDate(monday)}).
      </div>
      {coaches.isLoading ? (
        <Loading />
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit.mutate({ coachName, plannerUrl, weekDate, term }); }}>
          <div>
            <label className="label">Coach name</label>
            <select className="input" value={coachName} onChange={(e) => setCoachName(e.target.value)} required>
              <option value="">Select your name…</option>
              {(coaches.data ?? []).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Planner URL</label>
            <input className="input" type="url" placeholder="https://…" value={plannerUrl} onChange={(e) => setPlannerUrl(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={!coachName || submit.isPending}>
            {submit.isPending ? "Submitting…" : "Submit Planner"}
          </button>
          {result && <p className="text-center text-sm font-medium text-green-700">{result}</p>}
        </form>
      )}
    </div>
  );
}

function ManageCoachesPanel({ term }: { term: Term }) {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const coaches = trpc.coaches.list.useQuery({ term });
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const invalidate = () => utils.coaches.list.invalidate({ term });
  const create = trpc.coaches.create.useMutation({ onSuccess: () => { invalidate(); setName(""); toast("Coach added"); }, onError: (e) => toast(e.message, "error") });
  const update = trpc.coaches.update.useMutation({ onSuccess: () => { invalidate(); setEditId(null); toast("Coach renamed"); }, onError: (e) => toast(e.message, "error") });
  const del = trpc.coaches.delete.useMutation({ onSuccess: () => { invalidate(); toast("Coach removed"); }, onError: (e) => toast(e.message, "error") });

  return (
    <div className="card mt-8 p-6">
      <h2 className="heading mb-4 text-xl">Manage Coaches — {term.replace("term", "Term ")}</h2>
      <div className="mb-4 flex gap-2">
        <input className="input" placeholder="Add a coach…" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) create.mutate({ name: name.trim(), term }); }} />
        <button className="btn-primary whitespace-nowrap" disabled={!name.trim() || create.isPending} onClick={() => create.mutate({ name: name.trim(), term })}>
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {(coaches.data ?? []).map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded border px-3 py-2">
            {editId === c.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input className="input" value={editName} autoFocus onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") update.mutate({ id: c.id, name: editName }); if (e.key === "Escape") setEditId(null); }} />
                <button className="text-green-600" onClick={() => update.mutate({ id: c.id, name: editName })}><Check className="h-5 w-5" /></button>
                <button className="text-neutral-400" onClick={() => setEditId(null)}><X className="h-5 w-5" /></button>
              </div>
            ) : (
              <>
                <span>{c.name}</span>
                <div className="flex gap-2">
                  <button className="text-neutral-400 hover:text-[#dc2626]" onClick={() => { setEditId(c.id); setEditName(c.name); }}><Pencil className="h-4 w-4" /></button>
                  <button className="text-neutral-400 hover:text-[#dc2626]" onClick={() => { if (confirm(`Remove ${c.name}?`)) del.mutate({ id: c.id }); }}><Trash2 className="h-4 w-4" /></button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
