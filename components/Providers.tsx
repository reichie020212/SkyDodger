"use client";

import { SessionProvider } from "next-auth/react";

// Wraps the tree so any client component can call useSession() / useAuth
// patterns from next-auth/react. Currently nothing in the app calls
// useSession (server components read auth() directly), so this is
// defensive — it costs almost nothing and unblocks future client work.
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
