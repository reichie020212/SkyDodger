export type TagKind = "" | "green" | "teal" | "coral" | "red";

export function Tag({
  children,
  kind = "",
}: {
  children: React.ReactNode;
  kind?: TagKind;
}) {
  return <span className={"tag " + kind}>{children}</span>;
}
