import { useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, Users } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "../components/Toast";
import { PageContainer } from "../components/ui";

type Portal = "coach" | "admin";

export function Login() {
  const [portal, setPortal] = useState<Portal>("coach");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, navigate] = useLocation();
  const { refetch } = useAuth();
  const utils = trpc.useUtils();
  const { toast } = useToast();

  const onDone = async () => {
    await utils.invalidate();
    await refetch();
    navigate("/");
  };

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      toast("Welcome back!");
      await onDone();
    },
    onError: (e) => toast(e.message, "error"),
  });
  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      toast("Account created!");
      await onDone();
    },
    onError: (e) => toast(e.message, "error"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") login.mutate({ email, password });
    else register.mutate({ name, email, password });
  };

  const busy = login.isPending || register.isPending;
  // Admins never self-register — they sign in, then are promoted by an admin.
  const canRegister = portal === "coach";
  const showRegister = canRegister && mode === "register";

  const switchPortal = (p: Portal) => {
    setPortal(p);
    if (p === "admin") setMode("login");
  };

  return (
    <PageContainer className="max-w-md">
      {/* Portal chooser */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => switchPortal("coach")}
          className={"flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-semibold transition-colors " +
            (portal === "coach" ? "border-[#dc2626] bg-[#dc2626]/5 text-[#dc2626]" : "border-neutral-200 text-neutral-500 hover:border-neutral-300")}
        >
          <Users className="h-4 w-4" /> Coach
        </button>
        <button
          onClick={() => switchPortal("admin")}
          className={"flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-semibold transition-colors " +
            (portal === "admin" ? "border-neutral-900 bg-neutral-900/5 text-neutral-900" : "border-neutral-200 text-neutral-500 hover:border-neutral-300")}
        >
          <ShieldCheck className="h-4 w-4" /> Admin
        </button>
      </div>

      <div className="card p-8">
        <h1 className="heading mb-1 text-xl">
          {portal === "admin" ? "Admin sign in" : mode === "login" ? "Coach sign in" : "Create coach account"}
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          {portal === "admin"
            ? "For the management team. Coaches should use the Coach tab."
            : "Sign in to submit results, planners and add photos."}
        </p>

        {canRegister && (
          <div className="mb-6 flex gap-2">
            <button className={mode === "login" ? "btn-primary flex-1" : "btn-outline flex-1"} onClick={() => setMode("login")}>
              Sign in
            </button>
            <button className={mode === "register" ? "btn-primary flex-1" : "btn-outline flex-1"} onClick={() => setMode("register")}>
              Create account
            </button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {showRegister && (
            <div>
              <label className="label">Full name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            {showRegister && <p className="mt-1 text-xs text-neutral-500">At least 8 characters.</p>}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        {portal === "admin" ? (
          <p className="mt-4 text-center text-xs text-neutral-500">
            Need admin access? Sign in as a coach first, then request it from the home page — an existing
            admin approves you.
          </p>
        ) : (
          <p className="mt-4 text-center text-xs text-neutral-500">
            Anyone on the coaching team can create an account.
          </p>
        )}
      </div>
    </PageContainer>
  );
}
