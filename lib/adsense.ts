// AdSense slot configuration. Slot IDs are read from public env vars at
// build time so they are inlined into the client bundle. The kind →
// (data-ad-format, width, height) mapping comes from AdSense's standard
// unit catalog and the prototype's layout.

import type { AdKind } from "@/components/AdSlot";

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

const SLOTS: Record<AdKind, string> = {
  leaderboard: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD ?? "",
  rectangle: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE ?? "",
  skyscraper: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SKYSCRAPER ?? "",
  native: process.env.NEXT_PUBLIC_ADSENSE_SLOT_NATIVE ?? "",
  interstitial: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL ?? "",
  "banner-mobile": process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER_MOBILE ?? "",
};

export type AdMeta = {
  format: string;
  width?: number;
  height?: number;
  fullWidthResponsive?: boolean;
  sizeLabel: string;
  cls: string;
};

export const AD_META: Record<AdKind, AdMeta> = {
  leaderboard: {
    format: "horizontal",
    width: 728,
    height: 90,
    fullWidthResponsive: true,
    sizeLabel: "728 × 90",
    cls: "ad-leaderboard",
  },
  rectangle: {
    format: "rectangle",
    width: 300,
    height: 250,
    sizeLabel: "300 × 250",
    cls: "ad-rectangle",
  },
  skyscraper: {
    format: "vertical",
    width: 160,
    height: 600,
    sizeLabel: "160 × 600",
    cls: "ad-skyscraper",
  },
  native: {
    format: "fluid",
    fullWidthResponsive: true,
    sizeLabel: "In-feed native",
    cls: "ad-native",
  },
  interstitial: {
    format: "rectangle",
    width: 300,
    height: 250,
    sizeLabel: "300 × 250",
    cls: "ad-interstitial",
  },
  "banner-mobile": {
    format: "horizontal",
    width: 320,
    height: 100,
    fullWidthResponsive: true,
    sizeLabel: "320 × 100",
    cls: "ad-banner-mobile",
  },
};

export function slotIdFor(kind: AdKind): string {
  return SLOTS[kind] ?? "";
}

// True when both the AdSense client ID and the per-kind slot ID are
// configured. Anything else falls back to the dev placeholder so layouts
// stay readable without ads.
export function adsConfigured(kind: AdKind): boolean {
  return Boolean(ADSENSE_CLIENT) && Boolean(slotIdFor(kind));
}
