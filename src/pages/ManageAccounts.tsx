import { Check, ShieldCheck, ShieldOff, Trash2, UserCheck, Clock } from "lucide-react";
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
  approved: boolean;
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
  const setApproved = trpc.auth.setApproved.useMutation({
    onSuccess: () => { invalidate(); toast("Access updated"); },
    onError: (e) => toast(e.message, "error"),
  });
  const setRole = trpc.auth.setRole.useMutation({
    onSuccess: () => { invalidate(); toast("Role updated"); },
    onError: (e) => toast(e.message, "error"),
  });
  const del = trpc.auth.deleteUser.useMutation({
    onSuccess: () => { invalidate(); toast("Account removed"); },
    onError: (e) => toast(e.message, "error"),
  });

  const accounts = (list.data ?? []) as Account[];
  const pending = accounts.filter((a) => !a.approved);
  const active = accounts.filter((a) => a.approved);

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Coach Accounts"
        subtitle="Approve new sign-ups before they can access the hub. Coaches never see the admin panel unless you make them an admin."
      />

      {list.isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-8">
          {/* Pending approvals */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 heading text-lg">
              <Clock className="h-5 w-5 text-[#f59e0b]" /> Awaiting approval
              {pending.length > 0 && (
                <span className="badge bg-[#f59e0b] text-black">{pending.length}</span>
              )}
            </h2>
            {pending.length === 0 ? (
              <EmptyState>No accounts waiting. New sign-ups will appear here.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {pending.map((a) => (
                  <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900">{a.name || "—"}</p>
                      <p className="truncate text-sm text-neutral-500">{a.email}</p>
                      <p className="text-xs text-neutral-400">Signed up {a.createdAt ? formatDate(a.createdAt) : "—"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-primary" disabled={setApproved.isPending}
                        onClick={() => setApproved.mutate({ id: a.id, approved: true })}>
                        <Check className="h-4 w-4" /> Approve
                      </button>
                      <button className="btn-outline text-[#dc2626]" disabled={del.isPending}
                        onClick={() => { if (confirm(`Reject and delete ${a.email}?`)) del.mutate({ id: a.id }); }}>
                        <Trash2 className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Active accounts */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 heading text-lg">
              <UserCheck className="h-5 w-5 text-green-600" /> Active accounts
            </h2>
            <ul className="space-y-2">
              {active.map((a) => {
                const isSelf = a.id === user?.id;
                return (
                  <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-neutral-900">
                        {a.name || "—"}
                        {a.role === "admin" && (
                          <span className="badge bg-neutral-900 text-white">Admin</span>
                        )}
                        {isSelf && <span className="badge bg-neutral-200 text-neutral-600">You</span>}
                      </p>
                      <p className="truncate text-sm text-neutral-500">{a.email}</p>
                      <p className="text-xs text-neutral-400">
                        Last signed in {a.lastSignedIn ? formatDate(a.lastSignedIn) : "—"}
                      </p>
                    </div>
                    {!isSelf && (
                      <div className="flex flex-wrap gap-2">
                        {a.role === "admin" ? (
                          <button className="btn-outline" disabled={setRole.isPending}
                            onClick={() => { if (confirm(`Remove admin rights from ${a.email}?`)) setRole.mutate({ id: a.id, role: "user" }); }}>
                            <ShieldOff className="h-4 w-4" /> Make coach
                          </button>
                        ) : (
                          <button className="btn-outline" disabled={setRole.isPending}
                            onClick={() => { if (confirm(`Make ${a.email} an admin? They'll get full admin access.`)) setRole.mutate({ id: a.id, role: "admin" }); }}>
                            <ShieldCheck className="h-4 w-4" /> Make admin
                          </button>
                        )}
                        <button className="btn-outline" disabled={setApproved.isPending}
                          onClick={() => { if (confirm(`Suspend ${a.email}? They won't be able to sign in until re-approved.`)) setApproved.mutate({ id: a.id, approved: false }); }}>
                          Suspend
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </PageContainer>
  );
}
