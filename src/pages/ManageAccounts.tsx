import { Check, ShieldCheck, ShieldOff, Trash2, X, Clock } from "lucide-react";
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
  adminRequested: boolean;
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
    onSuccess: () => { invalidate(); toast("Role updated"); },
    onError: (e) => toast(e.message, "error"),
  });
  const dismiss = trpc.auth.dismissAdminRequest.useMutation({
    onSuccess: () => { invalidate(); toast("Request dismissed"); },
    onError: (e) => toast(e.message, "error"),
  });
  const del = trpc.auth.deleteUser.useMutation({
    onSuccess: () => { invalidate(); toast("Account removed"); },
    onError: (e) => toast(e.message, "error"),
  });

  const accounts = (list.data ?? []) as Account[];
  const requests = accounts.filter((a) => a.role !== "admin" && a.adminRequested);
  const admins = accounts.filter((a) => a.role === "admin");
  const coaches = accounts.filter((a) => a.role !== "admin" && !a.adminRequested);

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Team & Accounts"
        subtitle="Coaches sign up themselves. Admin seats are approved here — promote a coach to grant backend access."
      />

      {list.isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-8">
          {/* Admin access requests */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 heading text-lg">
              <Clock className="h-5 w-5 text-[#f59e0b]" /> Admin access requests
              {requests.length > 0 && <span className="badge bg-[#f59e0b] text-black">{requests.length}</span>}
            </h2>
            {requests.length === 0 ? (
              <EmptyState>No pending requests. Coaches who ask for admin access appear here.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {requests.map((a) => (
                  <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900">{a.name || "—"}</p>
                      <p className="truncate text-sm text-neutral-500">{a.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-primary" disabled={setRole.isPending}
                        onClick={() => setRole.mutate({ id: a.id, role: "admin" })}>
                        <Check className="h-4 w-4" /> Approve as admin
                      </button>
                      <button className="btn-outline" disabled={dismiss.isPending}
                        onClick={() => dismiss.mutate({ id: a.id })}>
                        <X className="h-4 w-4" /> Dismiss
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Admins */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 heading text-lg">
              <ShieldCheck className="h-5 w-5 text-neutral-900" /> Admins
              <span className="badge bg-neutral-200 text-neutral-600">{admins.length}</span>
            </h2>
            <ul className="space-y-2">
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
                        onClick={() => { if (confirm(`Remove admin rights from ${a.email}? They'll become a coach.`)) setRole.mutate({ id: a.id, role: "user" }); }}>
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
            {coaches.length === 0 ? (
              <EmptyState>No coach accounts yet.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {coaches.map((a) => (
                  <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900">{a.name || "—"}</p>
                      <p className="truncate text-sm text-neutral-500">{a.email}</p>
                      <p className="text-xs text-neutral-400">Last signed in {a.lastSignedIn ? formatDate(a.lastSignedIn) : "—"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-outline" disabled={setRole.isPending}
                        onClick={() => { if (confirm(`Make ${a.email} an admin? They'll get full backend access.`)) setRole.mutate({ id: a.id, role: "admin" }); }}>
                        <ShieldCheck className="h-4 w-4" /> Make admin
                      </button>
                      <button className="btn-outline text-[#dc2626]" disabled={del.isPending}
                        onClick={() => { if (confirm(`Remove ${a.email}? This deletes their account.`)) del.mutate({ id: a.id }); }}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
