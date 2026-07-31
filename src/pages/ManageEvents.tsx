import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useToast } from "../components/Toast";
import { AdminOnly } from "../components/Guards";
import { EventsCalendar } from "../components/EventsCalendar";
import { formatDateTime } from "../lib/utils";
import { isoDate } from "../lib/dates";
import { EmptyState, Loading, PageContainer, PageHeader } from "../components/ui";

const CATEGORIES = ["fixture", "festival", "tournament", "training"] as const;

export function ManageEvents() {
  return (
    <AdminOnly>
      <Inner />
    </AdminOnly>
  );
}

function Inner() {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const events = trpc.events.list.useQuery();
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", date: isoDate(new Date()), time: "12:00",
    category: "fixture" as (typeof CATEGORIES)[number], color: "#F59E0B",
  });

  const reset = () => { setEditId(null); setForm({ title: "", description: "", date: isoDate(new Date()), time: "12:00", category: "fixture", color: "#F59E0B" }); };
  const invalidate = () => utils.events.list.invalidate();

  const create = trpc.events.create.useMutation({ onSuccess: () => { invalidate(); reset(); toast("Event created"); }, onError: (e) => toast(e.message, "error") });
  const update = trpc.events.update.useMutation({ onSuccess: () => { invalidate(); reset(); toast("Event updated"); }, onError: (e) => toast(e.message, "error") });
  const del = trpc.events.delete.useMutation({ onSuccess: () => { invalidate(); toast("Event deleted"); }, onError: (e) => toast(e.message, "error") });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const date = new Date(`${form.date}T${form.time}:00`);
    const payload = { title: form.title, description: form.description || undefined, date, category: form.category, color: form.color };
    if (editId) update.mutate({ id: editId, ...payload });
    else create.mutate(payload);
  };

  const startEdit = (ev: any) => {
    const d = new Date(ev.date);
    setEditId(ev.id);
    setForm({
      title: ev.title, description: ev.description ?? "",
      date: isoDate(d), time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      category: ev.category, color: ev.color ?? "#F59E0B",
    });
  };

  return (
    <PageContainer>
      <PageHeader title="Manage Calendar" subtitle="Create and edit events shown on the public calendar." />
      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={submit} className="card h-fit p-6">
          <h2 className="heading mb-4 text-lg">{editId ? "Edit event" : "New event"}</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} required />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input className="input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
              </div>
              <div>
                <label className="label">Time</label>
                <input className="input" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Category</label>
                <select className="input capitalize" value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Colour</label>
                <input className="input h-10 p-1" type="color" value={form.color} onChange={(e) => set("color", e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1" disabled={create.isPending || update.isPending}>
                {editId ? "Save changes" : "Create event"}
              </button>
              {editId && <button type="button" className="btn-outline" onClick={reset}>Cancel</button>}
            </div>
          </div>
        </form>

        <div>
          {events.isLoading ? <Loading /> : <EventsCalendar events={events.data ?? []} />}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="heading mb-3 text-xl">All Events</h2>
        {events.isLoading ? (
          <Loading />
        ) : (events.data?.length ?? 0) === 0 ? (
          <EmptyState>No events yet.</EmptyState>
        ) : (
          <div className="card divide-y">
            {events.data!.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded" style={{ backgroundColor: ev.color ?? "#F59E0B" }} />
                  <div>
                    <div className="font-medium">{ev.title}</div>
                    <div className="text-xs text-neutral-500 capitalize">{ev.category} · {formatDateTime(ev.date)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-neutral-400 hover:text-[#dc2626]" onClick={() => startEdit(ev)}><Pencil className="h-4 w-4" /></button>
                  <button className="text-neutral-400 hover:text-[#dc2626]" onClick={() => { if (confirm("Delete event?")) del.mutate({ id: ev.id }); }}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
