import { useState } from "react";
import { Megaphone, Trash2, Send } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "./Toast";
import { formatDate } from "../lib/utils";

type Notice = { id: number; body: string; createdAt: string | Date | null };

/**
 * Homepage notice board — short universal messages to all coaches
 * ("Return all equipment by Friday"). Admins post/remove; everyone reads.
 */
export function NoticeBoard() {
  const { isAdmin } = useAuth();
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const list = trpc.notices.list.useQuery();
  const [body, setBody] = useState("");

  const invalidate = () => utils.notices.list.invalidate();
  const create = trpc.notices.create.useMutation({
    onSuccess: () => { invalidate(); setBody(""); toast("Notice posted"); },
    onError: (e) => toast(e.message, "error"),
  });
  const del = trpc.notices.delete.useMutation({
    onSuccess: () => { invalidate(); toast("Notice removed"); },
    onError: (e) => toast(e.message, "error"),
  });

  const notices = (list.data ?? []) as Notice[];

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#dc2626]/10 text-[#dc2626]">
          <Megaphone className="h-5 w-5" />
        </span>
        <div>
          <h3 className="heading text-base text-neutral-900">Notice Board</h3>
          <p className="text-xs text-neutral-500">Important updates for all coaches</p>
        </div>
      </div>

      {isAdmin && (
        <div className="mb-4 flex gap-2">
          <input
            className="input"
            placeholder="Post a notice for all coaches…"
            value={body}
            maxLength={500}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && body.trim()) create.mutate({ body }); }}
          />
          <button className="btn-primary shrink-0" disabled={!body.trim() || create.isPending}
            onClick={() => create.mutate({ body })}>
            <Send className="h-4 w-4" /> Post
          </button>
        </div>
      )}

      {notices.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">No notices right now.</p>
      ) : (
        <ul className="space-y-2">
          {notices.map((n) => (
            <li key={n.id} className="flex items-start gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#f59e0b]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-800">{n.body}</p>
                {n.createdAt && <p className="mt-0.5 text-xs text-neutral-400">{formatDate(n.createdAt)}</p>}
              </div>
              {isAdmin && (
                <button className="shrink-0 text-neutral-400 hover:text-[#dc2626]"
                  onClick={() => { if (confirm("Remove this notice?")) del.mutate({ id: n.id }); }}>
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
