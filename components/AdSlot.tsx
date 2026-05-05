// Placeholder AdSlot. Phase 6 replaces the body with real
// `<ins class="adsbygoogle">` units and the loader script. The dev
// fallback (rendered now) shows the slot kind + size so layouts can be
// designed against it before AdSense is wired.

export type AdKind =
  | "leaderboard"
  | "rectangle"
  | "skyscraper"
  | "native"
  | "interstitial"
  | "banner-mobile";

const SIZE_LABEL: Record<AdKind, string> = {
  leaderboard: "728 × 90",
  rectangle: "300 × 250",
  skyscraper: "160 × 600",
  native: "In-feed native",
  interstitial: "300 × 250",
  "banner-mobile": "320 × 100",
};

const CLASS_FOR: Record<AdKind, string> = {
  leaderboard: "ad-leaderboard",
  rectangle: "ad-rectangle",
  skyscraper: "ad-skyscraper",
  native: "ad-native",
  interstitial: "ad-interstitial",
  "banner-mobile": "ad-banner-mobile",
};

export function AdSlot({
  kind = "leaderboard",
  label,
}: {
  kind?: AdKind;
  label?: string;
}) {
  return (
    <div
      className="ad-wrap"
      style={{ margin: "0 auto", width: "fit-content", maxWidth: "100%" }}
    >
      <div className={"ad-slot " + CLASS_FOR[kind]}>
        <div style={{ textAlign: "center", lineHeight: 1.4 }}>
          {label ?? `Google AdSense · ${SIZE_LABEL[kind]}`}
          <div style={{ fontSize: 9, opacity: 0.65, marginTop: 4 }}>
            placeholder · Phase 6 wires real adsbygoogle
          </div>
        </div>
      </div>
    </div>
  );
}
