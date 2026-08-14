import { useState } from "react";
import { ShieldCheck, ShieldOff, Trash2, UserPlus } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "../components/Toast";
import { AdminOnly } from "../components/Guards";
import { EmptyState, Loading, PageContainer, PageHeader } from "../components/ui";
import { formatDate } from "../lib/utils";

type Account = {
  id: number;
  name: string | null;
  email: string;
  role: "user" | "admin";
  createdAt: string | Date | null;
  lastSignedIn: string | Date | null;
};

export function ManageAccounts() {
  return (
    <AdminOnly>
      <Inner />
    </AdminOnly>
  );
}

function Inner() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const list = trpc.auth.listUsers.useQuery();

  const invalidate = () => utils.auth.listUsers.invalidate();
  const setRole = trpc.auth.setRole.useMutation({
    onSuccess: () => { invalidate(); toast("Updated"); },
    onError: (e) => toast(e.message, "error"),
  });
  const del = trpc.auth.deleteUser.useMutation({
    onSuccess: () => { invalidate(); toast("Account removed"); },
    onError: (e) => toast(e.message, "error"),
  });

  const accounts = (list.data ?? []) as Account[];
  const admins = accounts.filter((a) => a.role === "admin");
  const coaches = accounts.filter((a) => a.role !== "admin");

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Team & Accounts"
        subtitle="Coaches sign in with their name and the shared access code — no accounts to manage. Admins have their own password logins; add them here."
      />

      {list.isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-8">
          {/* Admins */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 heading text-lg">
              <ShieldCheck className="h-5 w-5 text-neutral-900" /> Admins
              <span className="badge bg-neutral-200 text-neutral-600">{admins.length}</span>
            </h2>
            <AddAdminForm onAdded={invalidate} />
            <ul className="mt-3 space-y-2">
              {admins.map((a) => {
                const isSelf = a.id === user?.id;
                return (
                  <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-neutral-900">
                        {a.name || "—"}
                        {isSelf && <span className="badge bg-neutral-200 text-neutral-600">You</span>}
                      </p>
                      <p className="truncate text-sm text-neutral-500">{a.email}</p>
                      <p className="text-xs text-neutral-400">Last signed in {a.lastSignedIn ? formatDate(a.lastSignedIn) : "—"}</p>
                    </div>
                    {!isSelf && (
                      <button className="btn-outline" disabled={setRole.isPending}
                        onClick={() => { if (confirm(`Remove admin rights from ${a.email}?`)) setRole.mutate({ id: a.id, role: "user" }); }}>
                        <ShieldOff className="h-4 w-4" /> Make coach
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Coaches */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 heading text-lg">
              Coaches
              <span className="badge bg-neutral-200 text-neutral-600">{coaches.length}</span>
            </h2>
            <p className="mb-3 text-sm text-neutral-500">
              These are created automatically the first time a coach signs in. Remove any duplicates or test entries.
            </p>
            {coaches.length === 0 ? (
              <EmptyState>No coaches have signed in yet.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {coaches.map((a) => (
                  <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900">{a.name || "—"}</p>
                      <p className="text-xs text-neutral-400">Last signed in {a.lastSignedIn ? formatDate(a.lastSignedIn) : "—"}</p>
                    </div>
                    <button className="btn-outline text-[#dc2626]" disabled={del.isPending}
                      onClick={() => { if (confirm(`Remove ${a.name}? They can sign back in any time with their name + code.`)) del.mutate({ id: a.id }); }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </PageContainer>
  );
}

function AddAdminForm({ onAdded }: { onAdded: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const create = trpc.auth.createAdmin.useMutation({
    onSuccess: () => {
      onAdded();
      toast("Admin added");
      setName(""); setEmail(""); setPassword(""); setOpen(false);
    },
    onError: (e) => toast(e.message, "error"),
  });

  if (!open) {
    return (
      <button className="btn-outline" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" /> Add admin
      </button>
    );
  }

  return (
    <form
      className="card space-y-3 p-4"
      onSubmit={(e) => { e.preventDefault(); create.mutate({ name, email, password }); }}
    >
      <p className="heading text-sm text-neutral-500">New admin account</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <input className="input" type="text" placeholder="Password (8+ characters — share it with them)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={create.isPending}>
          {create.isPending ? "Adding…" : "Create admin"}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
