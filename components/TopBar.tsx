import Link from "next/link";
import { auth } from "@/lib/auth";
import { Avatar } from "./Avatar";
import { NavLinks } from "./NavLinks";
import { SignInButton } from "./SignInButton";

export async function TopBar() {
  const session = await auth();
  const user = session?.user;

  const links = [
    { href: "/play", label: "Play" },
    { href: "/leaderboards", label: "Leaderboards" },
    ...(user
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/profile", label: "Profile" },
        ]
      : []),
  ];

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/play" className="brand" style={{ textDecoration: "none" }}>
          <div className="brand-mark" />
          <span>Sky Dodger</span>
        </Link>
        <NavLinks links={links} />
        <div className="topbar-spacer" />
        {user ? (
          <Link
            href="/profile"
            className="user-chip"
            style={{ textDecoration: "none" }}
          >
            <Avatar name={user.name ?? user.email} hue={user.avatarHue} />
            <span>{(user.name ?? user.email ?? "you").split(" ")[0]}</span>
          </Link>
        ) : (
          <SignInButton callbackUrl="/play">Sign in</SignInButton>
        )}
      </div>
    </header>
  );
}
