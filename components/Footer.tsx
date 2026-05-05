import { auth } from "@/lib/auth";
import { SignOutLink } from "./SignOutLink";

export async function Footer() {
  const session = await auth();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div
        style={{
          display: "flex",
          gap: 24,
          justifyContent: "center",
          marginBottom: 8,
          fontSize: 12,
        }}
      >
        <a style={{ color: "inherit", textDecoration: "none" }}>About</a>
        <a style={{ color: "inherit", textDecoration: "none" }}>Privacy</a>
        <a style={{ color: "inherit", textDecoration: "none" }}>Terms</a>
        <a style={{ color: "inherit", textDecoration: "none" }}>Contact</a>
        {session?.user && <SignOutLink />}
      </div>
      <div>
        © {year} Sky Dodger · Original game · Not affiliated with any other
        product
      </div>
    </footer>
  );
}
