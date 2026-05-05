"use client";

import { signOut } from "next-auth/react";

export function SignOutLink() {
  return (
    <a
      style={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Sign out
    </a>
  );
}
