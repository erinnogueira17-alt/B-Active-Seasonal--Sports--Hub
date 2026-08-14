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
  const [, navigate] = useLocation();
  const { refetch } = useAuth();
  const utils = trpc.useUtils();
  const { toast } = useToast();

  const onDone = async () => {
    await utils.invalidate();
    await refetch();
    navigate("/");
  };

  return (
    <PageContainer className="max-w-md">
      {/* Portal chooser */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setPortal("coach")}
          className={"flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-semibold transition-colors " +
            (portal === "coach" ? "border-[#dc2626] bg-[#dc2626]/5 text-[#dc2626]" : "border-neutral-200 text-neutral-500 hover:border-neutral-300")}
        >
          <Users className="h-4 w-4" /> Coach
        </button>
        <button
          onClick={() => setPortal("admin")}
          className={"flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-semibold transition-colors " +
            (portal === "admin" ? "border-neutral-900 bg-neutral-900/5 text-neutral-900" : "border-neutral-200 text-neutral-500 hover:border-neutral-300")}
        >
          <ShieldCheck className="h-4 w-4" /> Admin
        </button>
      </div>

      <div className="card p-8">
        {portal === "coach" ? <CoachForm onDone={onDone} /> : <AdminForm onDone={onDone} />}
      </div>
    </PageContainer>
  );
}

function CoachForm({ onDone }: { onDone: () => Promise<void> }) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [pin, setPin] = useState("2026");

  const coachLogin = trpc.auth.coachLogin.useMutation({
    onSuccess: async () => { toast("Welcome!"); await onDone(); },
    onError: (e) => toast(e.message, "error"),
  });

  return (
    <>
      <h1 className="heading mb-1 text-xl">Coach sign in</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Just your name and the team access code — no password to remember.
      </p>
      <form
        className="space-y-4"
        onSubmit={(e) => { e.preventDefault(); coachLogin.mutate({ firstName, surname, pin }); }}
      >
        <div>
          <label className="label">First name</label>
          <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoFocus />
        </div>
        <div>
          <label className="label">Surname</label>
          <input className="input" value={surname} onChange={(e) => setSurname(e.target.value)} required />
        </div>
        <div>
          <label className="label">Access code</label>
          <input className="input tracking-widest" value={pin} onChange={(e) => setPin(e.target.value)} required inputMode="numeric" />
          <p className="mt-1 text-xs text-neutral-500">The shared team code (already filled in for you).</p>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={coachLogin.isPending || !firstName.trim() || !surname.trim()}>
          {coachLogin.isPending ? "Please wait…" : "Enter"}
        </button>
      </form>
    </>
  );
}

function AdminForm({ onDone }: { onDone: () => Promise<void> }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => { toast("Welcome back!"); await onDone(); },
    onError: (e) => toast(e.message, "error"),
  });

  return (
    <>
      <h1 className="heading mb-1 text-xl">Admin sign in</h1>
      <p className="mb-6 text-sm text-neutral-500">For the management team. Coaches should use the Coach tab.</p>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); login.mutate({ email, password }); }}>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={login.isPending}>
          {login.isPending ? "Please wait…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-neutral-500">
        Admin accounts are created by an existing admin on the Team page.
      </p>
    </>
  );
}
