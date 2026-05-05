import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Sky Dodger glyph — a coral disc on a sky-blue ground. Vercel/og's
// renderer (Satori) only supports a slice of CSS, so this is kept
// to gradients + border-radius.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(180deg, #a3d4e5, #f0d9b5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: "linear-gradient(135deg, #f6c557, #d99a25)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
