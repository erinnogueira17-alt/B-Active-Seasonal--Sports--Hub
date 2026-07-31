import { useState } from "react";
import { Trash2, Pencil, Check, X, Plus, Copy } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useToast } from "../components/Toast";
import { AdminOnly } from "../components/Guards";
import { TERMS, type Term } from "../lib/utils";
import { EmptyState, Loading, PageContainer, PageHeader, TermTabs } from "../components/ui";

export function ManageCoaches() {
  return (
    <AdminOnly>
      <Inner />
    </AdminOnly>
  );
}

function Inner() {
  const [term, setTerm] = useState<Term>("term3");
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const coaches = trpc.coaches.list.useQuery({ term });

  const [name, setName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const invalidateAll = () => utils.coaches.list.invalidate();
  const create = trpc.coaches.create.useMutation({ onSuccess: () => { invalidateAll(); setName(""); toast("Coach added"); }, onError: (e) => toast(e.message, "error") });
  const update = trpc.coaches.update.useMutation({ onSuccess: () => { invalidateAll(); setEditId(null); toast("Coach renamed"); }, onError: (e) => toast(e.message, "error") });
  const del = trpc.coaches.delete.useMutation({ onSuccess: () => { invalidateAll(); toast("Coach removed"); }, onError: (e) => toast(e.message, "error") });

  return (
    <PageContainer>
      <PageHeader title="Manage Coaches" subtitle="Maintain the coach roster for each term." />
      <TermTabs value={term} onChange={setTerm} />

      <div className="mb-4 flex gap-2">
        <input className="input" placeholder="Add a coach…" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) create.mutate({ name: name.trim(), term }); }} />
        <button className="btn-primary whitespace-nowrap" disabled={!name.trim() || create.isPending} onClick={() => create.mutate({ name: name.trim(), term })}>
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {coaches.isLoading ? (
        <Loading />
      ) : (coaches.data?.length ?? 0) === 0 ? (
        <EmptyState>No coaches in this term yet.</EmptyState>
      ) : (
        <ul className="mb-8 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.data!.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded border bg-white px-3 py-2">
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
      )}

      <CopyRoster />
    </PageContainer>
  );
}

function CopyRoster() {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const [fromTerm, setFromTerm] = useState<Term>("term3");
  const [toTerm, setToTerm] = useState<Term>("term4");
  const [overwrite, setOverwrite] = useState(false);

  const copy = trpc.coaches.copyRoster.useMutation({
    onSuccess: (res) => { utils.coaches.list.invalidate(); toast(`Copied ${res.copied} coach(es)`); },
    onError: (e) => toast(e.message, "error"),
  });

  return (
    <div className="card p-6">
      <h2 className="heading mb-4 text-lg">Copy Roster</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">From</label>
          <select className="input" value={fromTerm} onChange={(e) => setFromTerm(e.target.value as Term)}>
            {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">To</label>
          <select className="input" value={toTerm} onChange={(e) => setToTerm(e.target.value as Term)}>
            {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
          Overwrite target
        </label>
        <button className="btn-primary" disabled={fromTerm === toTerm || copy.isPending}
          onClick={() => copy.mutate({ fromTerm, toTerm, overwrite })}>
          <Copy className="h-4 w-4" /> Copy
        </button>
      </div>
    </div>
  );
}
