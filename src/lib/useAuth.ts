import { trpc } from "./trpc";

export function useAuth() {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    staleTime: 60_000,
  });
  const user = meQuery.data ?? null;
  return {
    user,
    isLoading: meQuery.isLoading,
    isAdmin: user?.role === "admin",
    isCoach: !!user && user.role !== "admin",
    isAuthed: !!user,
    adminRequested: !!user && (user as { adminRequested?: boolean }).adminRequested === true,
    refetch: meQuery.refetch,
  };
}
