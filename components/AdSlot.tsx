"use client";

import { useEffect, useRef } from "react";
import {
  AD_META,
  ADSENSE_CLIENT,
  adsConfigured,
  slotIdFor,
} from "@/lib/adsense";

export type AdKind =
  | "leaderboard"
  | "rectangle"
  | "skyscraper"
  | "native"
  | "interstitial"
  | "banner-mobile";

declare global {
  interface Window {
    adsbygoogle?: object[];
  }
}

const AD_LABEL = "Advertisement";

export function AdSlot({
  kind = "leaderboard",
  label,
}: {
  kind?: AdKind;
  label?: string;
}) {
  const meta = AD_META[kind];
  const configured = adsConfigured(kind);
  const slotId = slotIdFor(kind);
  const insRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!configured) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      /* swallow — AdSense will retry on next page navigation */
    }
  }, [configured, kind]);

  if (!configured) {
    return (
      <div
        className="ad-wrap"
        style={{ margin: "0 auto", width: "fit-content", maxWidth: "100%" }}
      >
        <div
          style={{
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--ink-3)",
            marginBottom: 4,
            textAlign: "center",
          }}
        >
          {AD_LABEL}
        </div>
        <div className={"ad-slot " + meta.cls}>
          <div style={{ textAlign: "center", lineHeight: 1.4 }}>
            {label ?? `Google AdSense · ${meta.sizeLabel}`}
            <div style={{ fontSize: 9, opacity: 0.65, marginTop: 4 }}>
              placeholder · set NEXT_PUBLIC_ADSENSE_CLIENT and the per-kind slot
              ID to enable
            </div>
          </div>
        </div>
      </div>
    );
  }

  const insStyle: React.CSSProperties = {
    display: "block",
    ...(meta.width ? { width: meta.width } : {}),
    ...(meta.height ? { height: meta.height } : {}),
  };

  return (
    <div
      className="ad-wrap"
      style={{ margin: "0 auto", width: "fit-content", maxWidth: "100%" }}
    >
      <div
        style={{
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--ink-3)",
          marginBottom: 4,
          textAlign: "center",
        }}
      >
        {AD_LABEL}
      </div>
      <ins
        ref={insRef}
        className={"adsbygoogle " + meta.cls}
        style={insStyle}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format={meta.format}
        data-full-width-responsive={
          meta.fullWidthResponsive ? "true" : undefined
        }
      />
    </div>
  );
}
