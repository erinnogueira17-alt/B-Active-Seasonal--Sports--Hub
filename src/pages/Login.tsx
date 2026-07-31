import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/useAuth";
import { useToast } from "../components/Toast";
import { PageContainer } from "../components/ui";

export function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, navigate] = useLocation();
  const [notice, setNotice] = useState<string | null>(null);
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
    onSuccess: async (data) => {
      if (data.pending) {
        // Pending accounts are not logged in — wait for admin approval.
        setNotice(
          "Account created! An admin needs to approve it before you can sign in. You'll be able to log in once approved.",
        );
        setMode("login");
        setPassword("");
        return;
      }
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

  return (
    <PageContainer className="max-w-md">
      <div className="card p-8">
        <div className="mb-6 flex gap-2">
          <button
            className={mode === "login" ? "btn-primary flex-1" : "btn-outline flex-1"}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            className={mode === "register" ? "btn-primary flex-1" : "btn-outline flex-1"}
            onClick={() => setMode("register")}
          >
            Create account
          </button>
        </div>

        {notice && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {notice}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="label">Full name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            {mode === "register" && (
              <p className="mt-1 text-xs text-neutral-500">At least 8 characters.</p>
            )}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-neutral-500">
          New accounts must be approved by an admin before you can sign in.
        </p>
      </div>
    </PageContainer>
  );
}
