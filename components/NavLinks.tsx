"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string };

export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  return (
    <nav className="nav">
      {links.map((l) => {
        const active =
          l.href === "/"
            ? pathname === "/"
            : pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={"nav-link" + (active ? " active" : "")}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
