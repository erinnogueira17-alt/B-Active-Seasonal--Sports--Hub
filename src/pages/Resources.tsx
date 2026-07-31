import { useMemo, useState } from "react";
import { Trash2, ExternalLink, Upload } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "../components/Toast";
import { fileToBase64, formatBytes, formatDate } from "../lib/utils";
import { EmptyState, Loading, PageContainer, PageHeader } from "../components/ui";

const CATEGORIES = ["football", "rugby", "hockey", "netball", "swimming", "athletics", "softball", "basketball", "tennis"] as const;
const SUBCATS = [
  ["coaching_guides", "Coaching Guides"],
  ["refereeing_umpiring", "Refereeing / Umpiring"],
] as const;

export function Resources() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<(typeof CATEGORIES)[number]>("football");
  const list = trpc.resources.list.useQuery();

  const byCat = useMemo(() => {
    return (list.data ?? []).filter((r) => r.category === tab);
  }, [list.data, tab]);

  return (
    <PageContainer>
      <PageHeader title="Resources" subtitle="Coaching guides and refereeing material, by sport." />

      {isAdmin && <UploadPanel />}

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setTab(c)}
            className={"rounded-full px-4 py-1.5 text-sm font-semibold capitalize " +
              (tab === c ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-100")}>
            {c}
          </button>
        ))}
      </div>

      {list.isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-8">
          {SUBCATS.map(([key, label]) => {
            const items = byCat.filter((r) => r.subcategory === key);
            return (
              <div key={key}>
                <h3 className="heading mb-3 text-lg text-[#dc2626]">{label}</h3>
                {items.length === 0 ? (
                  <EmptyState>No {label.toLowerCase()} for {tab} yet.</EmptyState>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((r) => <ResourceCard key={r.id} r={r} isAdmin={isAdmin} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

function ResourceCard({ r, isAdmin }: { r: any; isAdmin: boolean }) {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const del = trpc.resources.delete.useMutation({
    onSuccess: () => { utils.resources.list.invalidate(); toast("Resource deleted"); },
    onError: (e) => toast(e.message, "error"),
  });
  return (
    <div className="card flex flex-col p-4">
      <div className="font-semibold">{r.title}</div>
      {r.description && <p className="mt-1 text-sm text-neutral-600">{r.description}</p>}
      <div className="mt-2 text-xs text-neutral-400">{formatBytes(r.fileSize)} · {formatDate(r.createdAt)}</div>
      <div className="mt-3 flex gap-2">
        <a href={r.fileUrl} target="_blank" rel="noreferrer" className="btn-gold flex-1">
          <ExternalLink className="h-4 w-4" /> View
        </a>
        {isAdmin && (
          <button className="btn-outline" onClick={() => { if (confirm("Delete?")) del.mutate({ id: r.id }); }}>
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function UploadPanel() {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("football");
  const [subcategory, setSubcategory] = useState<(typeof SUBCATS)[number][0]>("coaching_guides");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const upload = trpc.resources.upload.useMutation({
    onSuccess: () => {
      utils.resources.list.invalidate();
      toast("Resource uploaded");
      setTitle(""); setDescription(""); setFile(null);
    },
    onError: (e) => toast(e.message, "error"),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const fileData = await fileToBase64(file);
    upload.mutate({
      title, description: description || undefined, category, subcategory,
      fileData, fileName: file.name, fileType: file.type || "application/octet-stream", fileSize: file.size,
    });
  };

  return (
    <form onSubmit={submit} className="card mb-8 p-6">
      <h2 className="heading mb-4 text-xl">Upload Resource</h2>
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
          <label className="label">Description (optional)</label>
          <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">File (max 16 MB)</label>
          <input type="file" className="input" onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
          }} required />
        </div>
      </div>
      <button type="submit" className="btn-primary mt-4" disabled={!file || upload.isPending}>
        <Upload className="h-4 w-4" /> {upload.isPending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
