type AvatarSize = "sm" | "md" | "lg" | "xl";

export function Avatar({
  name,
  hue = 200,
  size = "sm",
}: {
  name: string | null | undefined;
  hue?: number;
  size?: AvatarSize;
}) {
  const initials = (name ?? "?")
    .split(/\s+/)
    .map((s) => s[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const cls =
    "avatar" +
    (size === "lg" ? " lg" : size === "xl" ? " xl" : size === "sm" ? " sm" : "");
  const bg = `linear-gradient(135deg, oklch(0.72 0.16 ${hue}), oklch(0.6 0.18 ${
    (hue + 40) % 360
  }))`;

  return (
    <div className={cls} style={{ background: bg }}>
      {initials}
    </div>
  );
}
