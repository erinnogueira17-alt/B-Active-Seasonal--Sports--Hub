import { useMemo, useState } from "react";
import { Trash2, Download, Pencil, X, Upload, Check } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "../components/Toast";
import { uploadToBlob } from "../lib/blobUpload";
import { labelFromFilename } from "../lib/utils";
import { EmptyState, Loading, PageContainer, PageHeader } from "../components/ui";

type Photo = { id: number; title: string | null; caption: string | null; imageUrl: string; createdAt: string | Date };

/** Visible label for a photo: an admin caption if set, else derived from the filename. */
function photoLabel(p: Photo): string {
  return p.caption?.trim() || labelFromFilename(p.title);
}

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
            {photoLabel(lightbox) && <p className="mb-2 font-medium">{photoLabel(lightbox)}</p>}
            <button className="btn-gold" onClick={(e) => { e.stopPropagation(); downloadImage(lightbox.imageUrl, photoLabel(lightbox) || "photo"); }}>
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

  const label = photoLabel(p);
  return (
    <div className="card group overflow-hidden">
      <div className="relative overflow-hidden bg-neutral-200">
        <img src={p.imageUrl} alt={label} className="h-40 w-full cursor-pointer object-cover" onClick={onOpen} loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button className="rounded bg-white/90 p-1" onClick={() => downloadImage(p.imageUrl, label || "photo")}><Download className="h-4 w-4" /></button>
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
      {label && (
        <div className="px-2 py-1.5 text-center text-xs font-medium text-neutral-700" title={label}>
          {label}
        </div>
      )}
    </div>
  );
}

function UploadArea() {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const save = trpc.gallery.saveUploaded.useMutation();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    let ok = 0;
    let failed = 0;
    setProgress({ done: 0, total: list.length });
    for (const [i, file] of list.entries()) {
      try {
        const { url, pathname } = await uploadToBlob("gallery", file);
        await save.mutateAsync({ url, pathname, title: file.name });
        ok++;
      } catch (e: any) {
        failed++;
        toast(`Failed: ${file.name} — ${e?.message ?? "upload error"}`, "error");
      }
      setProgress({ done: i + 1, total: list.length });
    }
    setProgress(null);
    utils.gallery.list.invalidate();
    if (ok) toast(`${ok} photo${ok > 1 ? "s" : ""} uploaded${failed ? `, ${failed} failed` : ""}`);
  };

  const busy = progress !== null;
  return (
    <label className="card mb-8 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 text-center text-neutral-500 hover:border-[#dc2626]">
      <Upload className="mb-2 h-8 w-8 text-[#dc2626]" />
      <span className="font-medium">
        {busy ? `Uploading ${progress!.done}/${progress!.total}…` : "Click or drag to upload photos"}
      </span>
      <span className="text-xs">Multiple images supported · max 25 MB each</span>
      <input type="file" accept="image/*" multiple className="hidden" disabled={busy}
        onChange={(e) => handleFiles(e.target.files)} />
    </label>
  );
}
