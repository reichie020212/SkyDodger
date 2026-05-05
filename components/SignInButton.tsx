"use client";

import { signIn } from "next-auth/react";
import { GoogleG } from "./GoogleG";

export function SignInButton({
  size = "sm",
  fullWidth = false,
  callbackUrl = "/",
  children,
}: {
  size?: "sm" | "lg";
  fullWidth?: boolean;
  callbackUrl?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      className={`btn btn-google ${size === "lg" ? "btn-lg" : "btn-sm"}`}
      style={fullWidth ? { width: "100%", justifyContent: "center" } : undefined}
      onClick={() => signIn("google", { callbackUrl })}
    >
      <GoogleG />
      {children ?? "Continue with Google"}
    </button>
  );
}
