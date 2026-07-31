import { useState } from "react";
import { Pencil, Trash2, Check, X, Plus, Link2, Upload, FileCheck2 } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "../components/Toast";
import { uploadToBlob } from "../lib/blobUpload";
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
  const [mode, setMode] = useState<"link" | "file">("link");
  const [plannerUrl, setPlannerUrl] = useState("");
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const submit = trpc.planner.submit.useMutation({
    onSuccess: (res) => {
      setResult(res.awarded ? "✅ Submitted! +2 points awarded" : "✅ Updated — no additional points (already submitted this week)");
      setPlannerUrl("");
      setUploadedName(null);
      toast(res.awarded ? "+2 points awarded!" : "Planner updated");
    },
    onError: (e) => toast(e.message, "error"),
  });

  const switchMode = (m: "link" | "file") => {
    setMode(m);
    setPlannerUrl("");
    setUploadedName(null);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadToBlob("planner", file);
      setPlannerUrl(url);
      setUploadedName(file.name);
      toast("File attached — now submit");
    } catch (e: any) {
      toast(`Upload failed: ${e?.message ?? "error"}`, "error");
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = !!coachName && !!plannerUrl && !uploading && !submit.isPending;

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
            <label className="label">Your planner</label>
            {/* Link / file toggle */}
            <div className="mb-2 inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-sm">
              <button type="button" onClick={() => switchMode("link")}
                className={"flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors " + (mode === "link" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500")}>
                <Link2 className="h-4 w-4" /> Paste link
              </button>
              <button type="button" onClick={() => switchMode("file")}
                className={"flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors " + (mode === "file" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500")}>
                <Upload className="h-4 w-4" /> Upload file
              </button>
            </div>

            {mode === "link" ? (
              <input className="input" type="url" placeholder="https://…" value={plannerUrl}
                onChange={(e) => setPlannerUrl(e.target.value)} required />
            ) : uploadedName ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                <span className="flex min-w-0 items-center gap-2">
                  <FileCheck2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{uploadedName}</span>
                </span>
                <button type="button" className="shrink-0 text-neutral-500 hover:text-[#dc2626]" onClick={() => { setPlannerUrl(""); setUploadedName(null); }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-neutral-300 p-5 text-center text-sm text-neutral-500 hover:border-[#dc2626]">
                <Upload className="mb-1 h-6 w-6 text-[#dc2626]" />
                <span className="font-medium">{uploading ? "Uploading…" : "Click to choose a file"}</span>
                <span className="text-xs">PDF, Word, Excel, PowerPoint or image · max 25 MB</span>
                <input type="file" className="hidden" disabled={uploading}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*"
                  onChange={(e) => handleFile(e.target.files?.[0])} />
              </label>
            )}
          </div>

          <button type="submit" className="btn-primary w-full" disabled={!canSubmit}>
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
