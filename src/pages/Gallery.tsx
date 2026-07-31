import { useMemo, useState } from "react";
import { Trash2, Download, Pencil, X, Upload, Check } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "../components/Toast";
import { fileToBase64 } from "../lib/utils";
import { EmptyState, Loading, PageContainer, PageHeader } from "../components/ui";

type Photo = { id: number; title: string | null; caption: string | null; imageUrl: string; createdAt: string | Date };

function monthKey(d: string | Date) {
  return new Date(d).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function downloadImage(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name.replace(/\s+/g, "_") || "photo";
  a.target = "_blank";
  a.click();
}

export function Gallery() {
  const { isAdmin } = useAuth();
  const list = trpc.gallery.list.useQuery();
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Photo[]>();
    for (const p of (list.data ?? []) as Photo[]) {
      const k = monthKey(p.createdAt);
      const arr = map.get(k) ?? [];
      arr.push(p);
      map.set(k, arr);
    }
    return Array.from(map.entries());
  }, [list.data]);

  return (
    <PageContainer>
      <PageHeader title="Gallery" subtitle="Photos from sessions, fixtures and festivals." />

      {isAdmin && <UploadArea />}

      {list.isLoading ? (
        <Loading />
      ) : grouped.length === 0 ? (
        <EmptyState>No photos yet.</EmptyState>
      ) : (
        <div className="space-y-10">
          {grouped.map(([month, photos]) => (
            <div key={month}>
              <h2 className="heading mb-3 text-xl text-neutral-800">{month}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((p) => (
                  <PhotoTile key={p.id} p={p} isAdmin={isAdmin} onOpen={() => setLightbox(p)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox.imageUrl} alt={lightbox.caption ?? ""} className="max-h-[80vh] max-w-full rounded" onClick={(e) => e.stopPropagation()} />
          <div className="mt-3 text-center text-white">
            {lightbox.caption && <p className="mb-2">{lightbox.caption}</p>}
            <button className="btn-gold" onClick={(e) => { e.stopPropagation(); downloadImage(lightbox.imageUrl, lightbox.caption || lightbox.title || "photo"); }}>
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function PhotoTile({ p, isAdmin, onOpen }: { p: Photo; isAdmin: boolean; onOpen: () => void }) {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(p.caption ?? "");

  const del = trpc.gallery.delete.useMutation({ onSuccess: () => { utils.gallery.list.invalidate(); toast("Photo deleted"); } });
  const updateCaption = trpc.gallery.updateCaption.useMutation({
    onSuccess: () => { utils.gallery.list.invalidate(); setEditing(false); toast("Caption saved"); },
    onError: (e) => toast(e.message, "error"),
  });

  return (
    <div className="group relative overflow-hidden rounded-lg bg-neutral-200">
      <img src={p.imageUrl} alt={p.caption ?? ""} className="h-40 w-full cursor-pointer object-cover" onClick={onOpen} loading="lazy" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button className="rounded bg-white/90 p-1" onClick={() => downloadImage(p.imageUrl, p.caption || p.title || "photo")}><Download className="h-4 w-4" /></button>
        {isAdmin && <button className="rounded bg-white/90 p-1" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></button>}
        {isAdmin && <button className="rounded bg-white/90 p-1 text-[#dc2626]" onClick={() => { if (confirm("Delete photo?")) del.mutate({ id: p.id }); }}><Trash2 className="h-4 w-4" /></button>}
      </div>
      {editing && (
        <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-2">
          <input className="input text-xs" value={caption} onChange={(e) => setCaption(e.target.value)} autoFocus placeholder="Caption" />
          <div className="mt-1 flex justify-end gap-1">
            <button className="rounded bg-green-600 p-1 text-white" onClick={() => updateCaption.mutate({ id: p.id, caption })}><Check className="h-4 w-4" /></button>
            <button className="rounded bg-neutral-600 p-1 text-white" onClick={() => setEditing(false)}><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadArea() {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const upload = trpc.gallery.upload.useMutation();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      try {
        const imageData = await fileToBase64(file);
        await upload.mutateAsync({ imageData, fileName: file.name, title: file.name });
      } catch (e: any) {
        toast(`Failed: ${file.name}`, "error");
      }
    }
    setBusy(false);
    utils.gallery.list.invalidate();
    toast("Upload complete");
  };

  return (
    <label className="card mb-8 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 text-center text-neutral-500 hover:border-[#dc2626]">
      <Upload className="mb-2 h-8 w-8 text-[#dc2626]" />
      <span className="font-medium">{busy ? "Uploading…" : "Click to upload photos"}</span>
      <span className="text-xs">Multiple images supported · max 10 MB each</span>
      <input type="file" accept="image/*" multiple className="hidden" disabled={busy}
        onChange={(e) => handleFiles(e.target.files)} />
    </label>
  );
}
