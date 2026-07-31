import { useState } from "react";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "../components/Toast";
import { formatDate } from "../lib/utils";
import { recentMondays, mondaysBetween, isoDate } from "../lib/dates";
import { ReportView } from "../components/ReportView";
import { EmptyState, Loading, PageContainer, PageHeader } from "../components/ui";

const SPORTS = ["Football", "Rugby", "Hockey", "Netball", "Athletics", "Cricket", "Swimming", "Tennis", "Softball", "Basketball"];

export function Results() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const schools = trpc.schools.list.useQuery();
  const results = trpc.results.list.useQuery();

  return (
    <PageContainer>
      <PageHeader title="Weekly Results" subtitle="Submit and review match results across every school." />
      <div className="grid gap-8 lg:grid-cols-2">
        <SubmitForm schools={schools.data ?? []} onDone={() => utils.results.list.invalidate()} />
        {isAdmin && <ReportPanel schools={schools.data ?? []} allResults={results.data ?? []} />}
      </div>

      {isAdmin && <SchoolManager />}

      <div className="mt-10">
        <h2 className="heading mb-3 text-2xl">Recent Results</h2>
        {results.isLoading ? (
          <Loading />
        ) : (results.data?.length ?? 0) === 0 ? (
          <EmptyState>No results submitted yet.</EmptyState>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950 text-white">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Coach</th>
                  <th className="px-3 py-2">Sport</th>
                  <th className="px-3 py-2">School</th>
                  <th className="px-3 py-2">Opposition</th>
                  <th className="px-3 py-2">Result</th>
                  {isAdmin && <th className="px-3 py-2"></th>}
                </tr>
              </thead>
              <tbody>
                {results.data!.slice(0, 20).map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-neutral-50">
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="px-3 py-2">{r.coachName}</td>
                    <td className="px-3 py-2">{r.sport}</td>
                    <td className="px-3 py-2">{r.team}</td>
                    <td className="px-3 py-2">{r.opposition || "—"}</td>
                    <td className="px-3 py-2 font-semibold">{r.result || "—"}</td>
                    {isAdmin && (
                      <td className="px-3 py-2">
                        <DeleteResult id={r.id} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function DeleteResult({ id }: { id: number }) {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const del = trpc.results.delete.useMutation({
    onSuccess: () => { utils.results.list.invalidate(); toast("Result deleted"); },
    onError: (e) => toast(e.message, "error"),
  });
  return (
    <button className="text-neutral-400 hover:text-[#dc2626]"
      onClick={() => { if (confirm("Delete this result?")) del.mutate({ id }); }}>
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function SubmitForm({ schools, onDone }: { schools: { id: number; name: string }[]; onDone: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    coachName: "", sport: "Football", team: "", ageGroup: "",
    date: isoDate(new Date()), opposition: "", result: "", feedback: "",
  });
  const submit = trpc.results.submit.useMutation({
    onSuccess: () => {
      toast("Result submitted!");
      setForm((f) => ({ ...f, opposition: "", result: "", feedback: "", ageGroup: "" }));
      onDone();
    },
    onError: (e) => toast(e.message, "error"),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      className="card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit.mutate({ ...form, date: new Date(form.date), ageGroup: form.ageGroup || undefined });
      }}
    >
      <h2 className="heading mb-4 text-xl">Submit a Result</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Coach name</label>
          <input className="input" value={form.coachName} onChange={(e) => set("coachName", e.target.value)} required />
        </div>
        <div>
          <label className="label">Sport</label>
          <select className="input" value={form.sport} onChange={(e) => set("sport", e.target.value)}>
            {SPORTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">School / Team</label>
          <select className="input" value={form.team} onChange={(e) => set("team", e.target.value)} required>
            <option value="">Select…</option>
            {schools.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Age group (optional)</label>
          <input className="input" value={form.ageGroup} onChange={(e) => set("ageGroup", e.target.value)} />
        </div>
        <div>
          <label className="label">Match date</label>
          <input className="input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
        </div>
        <div>
          <label className="label">Opposition</label>
          <input className="input" value={form.opposition} onChange={(e) => set("opposition", e.target.value)} />
        </div>
        <div>
          <label className="label">Result / Score</label>
          <input className="input" value={form.result} onChange={(e) => set("result", e.target.value)} placeholder="e.g. Win 3-1" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Feedback (optional)</label>
          <textarea className="input" rows={2} value={form.feedback} onChange={(e) => set("feedback", e.target.value)} />
        </div>
      </div>
      <button type="submit" className="btn-primary mt-4 w-full" disabled={submit.isPending}>
        {submit.isPending ? "Submitting…" : "Submit Result"}
      </button>
    </form>
  );
}

function ReportPanel({ schools, allResults }: { schools: { id: number; name: string }[]; allResults: any[] }) {
  const mondays = recentMondays(12);
  const [school, setSchool] = useState("");
  const [week, setWeek] = useState(isoDate(mondays[0]));
  const [rangeStart, setRangeStart] = useState(isoDate(mondays[3]));
  const [rangeEnd, setRangeEnd] = useState(isoDate(mondays[0]));
  const [report, setReport] = useState<{ mondays: Date[] } | null>(null);

  return (
    <div className="card p-6">
      <h2 className="heading mb-4 text-xl">Download Reports</h2>
      <div className="space-y-4">
        <div>
          <label className="label">School</label>
          <select className="input" value={school} onChange={(e) => setSchool(e.target.value)}>
            <option value="">Select a school…</option>
            {schools.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        <div className="rounded-lg border p-3">
          <div className="mb-2 text-sm font-semibold">Weekly report</div>
          <div className="flex gap-2">
            <select className="input" value={week} onChange={(e) => setWeek(e.target.value)}>
              {mondays.map((m) => <option key={m.toISOString()} value={isoDate(m)}>Week of {formatDate(m)}</option>)}
            </select>
            <button className="btn-primary whitespace-nowrap" disabled={!school}
              onClick={() => setReport({ mondays: [new Date(week + "T00:00:00")] })}>
              Weekly
            </button>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="mb-2 text-sm font-semibold">Multi-week report</div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1">
              <label className="label text-xs">From</label>
              <select className="input" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)}>
                {mondays.map((m) => <option key={m.toISOString()} value={isoDate(m)}>{formatDate(m)}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="label text-xs">To</label>
              <select className="input" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)}>
                {mondays.map((m) => <option key={m.toISOString()} value={isoDate(m)}>{formatDate(m)}</option>)}
              </select>
            </div>
            <button className="btn-primary" disabled={!school}
              onClick={() => setReport({ mondays: mondaysBetween(new Date(rangeStart + "T00:00:00"), new Date(rangeEnd + "T00:00:00")) })}>
              Multi-week
            </button>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          Reports open in a print view — use “Print / Save PDF” to download a branded PDF.
        </p>
      </div>

      {report && school && (
        <ReportView school={school} mondays={report.mondays} results={allResults} onClose={() => setReport(null)} />
      )}
    </div>
  );
}

function SchoolManager() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const schools = trpc.schools.list.useQuery();
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const invalidate = () => utils.schools.list.invalidate();
  const create = trpc.schools.create.useMutation({ onSuccess: () => { invalidate(); setNewName(""); toast("School added"); }, onError: (e) => toast(e.message, "error") });
  const update = trpc.schools.update.useMutation({ onSuccess: () => { invalidate(); setEditId(null); toast("School renamed"); }, onError: (e) => toast(e.message, "error") });
  const del = trpc.schools.delete.useMutation({ onSuccess: () => { invalidate(); toast("School deleted"); }, onError: (e) => toast(e.message, "error") });

  return (
    <div className="card mt-8 p-6">
      <h2 className="heading mb-4 text-xl">Manage Schools</h2>
      <div className="mb-4 flex gap-2">
        <input className="input" placeholder="Add a school…" value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) create.mutate({ name: newName.trim() }); }} />
        <button className="btn-primary whitespace-nowrap" disabled={!newName.trim() || create.isPending}
          onClick={() => create.mutate({ name: newName.trim() })}>
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      <ul className="divide-y">
        {(schools.data ?? []).map((s) => (
          <li key={s.id} className="flex items-center justify-between py-2">
            {editId === s.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input className="input" value={editName} autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") update.mutate({ id: s.id, name: editName });
                    if (e.key === "Escape") setEditId(null);
                  }} />
                <button className="text-green-600" onClick={() => update.mutate({ id: s.id, name: editName })}><Check className="h-5 w-5" /></button>
                <button className="text-neutral-400" onClick={() => setEditId(null)}><X className="h-5 w-5" /></button>
              </div>
            ) : (
              <>
                <span>{s.name}</span>
                <div className="flex gap-2">
                  <button className="text-neutral-400 hover:text-[#dc2626]" onClick={() => { setEditId(s.id); setEditName(s.name); }}><Pencil className="h-4 w-4" /></button>
                  <button className="text-neutral-400 hover:text-[#dc2626]" onClick={() => { if (confirm(`Delete ${s.name}?`)) del.mutate({ id: s.id }); }}><Trash2 className="h-4 w-4" /></button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
