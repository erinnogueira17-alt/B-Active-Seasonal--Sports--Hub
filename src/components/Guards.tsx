import { type ReactNode } from "react";
import { Link } from "wouter";
import { Lock } from "lucide-react";
import { useAuth } from "../lib/useAuth";
import { Loading, PageContainer } from "./ui";

export function AdminOnly({ children }: { children: ReactNode }) {
  const { isLoading, isAuthed, isAdmin } = useAuth();
  if (isLoading) return <Loading />;

  if (!isAuthed) {
    return (
      <PageContainer>
        <div className="card mx-auto max-w-md p-8 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-[#dc2626]" />
          <h2 className="heading text-xl">Login Required</h2>
          <p className="mt-2 text-neutral-600">Please sign in to access this area.</p>
          <Link href="/login" className="btn-primary mt-4">
            Sign in
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (!isAdmin) {
    return (
      <PageContainer>
        <div className="card mx-auto max-w-md p-8 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-[#dc2626]" />
          <h2 className="heading text-xl">Access Denied</h2>
          <p className="mt-2 text-neutral-600">
            This area is restricted to administrators.
          </p>
        </div>
      </PageContainer>
    );
  }

  return <>{children}</>;
}
