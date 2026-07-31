import { useState } from "react";
import { Trash2, Pencil, Upload, Check, X } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useToast } from "../components/Toast";
import { AdminOnly } from "../components/Guards";
import { fileToBase64, formatBytes, formatDate } from "../lib/utils";
import { EmptyState, Loading, PageContainer, PageHeader } from "../components/ui";

const CATEGORIES = ["football", "rugby", "hockey", "netball", "swimming", "athletics", "softball", "basketball", "tennis"] as const;
const SUBCATS = [["coaching_guides", "Coaching Guides"], ["refereeing_umpiring", "Refereeing / Umpiring"]] as const;

export function ManageResources() {
  return (
    <AdminOnly>
      <Inner />
    </AdminOnly>
  );
}

function Inner() {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const list = trpc.resources.list.useQuery();

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("football");
  const [subcategory, setSubcategory] = useState<(typeof SUBCATS)[number][0]>("coaching_guides");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const upload = trpc.resources.upload.useMutation({
    onSuccess: () => { utils.resources.list.invalidate(); toast("Uploaded"); setTitle(""); setDescription(""); setFile(null); },
    onError: (e) => toast(e.message, "error"),
  });
  const del = trpc.resources.delete.useMutation({ onSuccess: () => { utils.resources.list.invalidate(); toast("Deleted"); } });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const fileData = await fileToBase64(file);
    upload.mutate({ title, description: description || undefined, category, subcategory, fileData, fileName: file.name, fileType: file.type || "application/octet-stream", fileSize: file.size });
  };

  return (
    <PageContainer>
      <PageHeader title="Manage Resources" subtitle="Upload and organise coaching and officiating material." />
      <form onSubmit={submit} className="card mb-8 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Sport</label>
            <select className="input capitalize" value={category} onChange={(e) => setCategory(e.target.value as any)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={subcategory} onChange={(e) => setSubcategory(e.target.value as any)}>
              {SUBCATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">File (max 16 MB)</label>
            <input type="file" className="input" onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, "")); }} required />
          </div>
        </div>
        <button type="submit" className="btn-primary mt-4" disabled={!file || upload.isPending}>
          <Upload className="h-4 w-4" /> {upload.isPending ? "Uploading…" : "Upload"}
        </button>
      </form>

      <h2 className="heading mb-3 text-xl">All Resources</h2>
      {list.isLoading ? (
        <Loading />
      ) : (list.data?.length ?? 0) === 0 ? (
        <EmptyState>No resources uploaded yet.</EmptyState>
      ) : (
        <div className="card divide-y">
          {list.data!.map((r) => <ResourceRow key={r.id} r={r} onDelete={() => { if (confirm("Delete?")) del.mutate({ id: r.id }); }} />)}
        </div>
      )}
    </PageContainer>
  );
}

function ResourceRow({ r, onDelete }: { r: any; onDelete: () => void }) {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: r.title, description: r.description ?? "", category: r.category, subcategory: r.subcategory ?? "coaching_guides" });
  const update = trpc.resources.update.useMutation({
    onSuccess: () => { utils.resources.list.invalidate(); setEditing(false); toast("Updated"); },
    onError: (e) => toast(e.message, "error"),
  });

  if (editing) {
    return (
      <div className="space-y-2 p-3">
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex gap-2">
          <select className="input capitalize" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}>
            {SUBCATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-primary" onClick={() => update.mutate({ id: r.id, ...form })}><Check className="h-4 w-4" /> Save</button>
          <button className="btn-outline" onClick={() => setEditing(false)}><X className="h-4 w-4" /> Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3">
      <div>
        <div className="font-medium">{r.title}</div>
        <div className="text-xs text-neutral-500 capitalize">{r.category} · {r.subcategory?.replace("_", " ")} · {formatBytes(r.fileSize)} · {formatDate(r.createdAt)}</div>
      </div>
      <div className="flex gap-2">
        <a href={r.fileUrl} target="_blank" rel="noreferrer" className="btn-gold">View</a>
        <button className="text-neutral-400 hover:text-[#dc2626]" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></button>
        <button className="text-neutral-400 hover:text-[#dc2626]" onClick={onDelete}><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
