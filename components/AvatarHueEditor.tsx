"use client";

import { useState, useTransition } from "react";
import { Avatar } from "./Avatar";
import { updateAvatarHue } from "@/lib/actions";

export function AvatarHueEditor({
  name,
  initialHue,
}: {
  name: string | null | undefined;
  initialHue: number;
}) {
  const [hue, setHue] = useState(initialHue);
  const [savedHue, setSavedHue] = useState(initialHue);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  function commit(next: number) {
    setStatus("idle");
    startTransition(async () => {
      const res = await updateAvatarHue(next);
      if (res.ok) {
        setSavedHue(next);
        setStatus("saved");
      } else {
        setStatus("error");
        setHue(savedHue);
      }
    });
  }

  return (
    <div
      className="card card-pad"
      style={{ display: "flex", gap: 16, alignItems: "center" }}
    >
      <Avatar name={name} hue={hue} size="lg" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          Avatar color
        </div>
        <input
          type="range"
          min={0}
          max={359}
          value={hue}
          onChange={(e) => setHue(Number(e.target.value))}
          onPointerUp={() => hue !== savedHue && commit(hue)}
          onKeyUp={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              if (hue !== savedHue) commit(hue);
            }
          }}
          style={{ width: "100%" }}
          aria-label="Avatar hue"
        />
        <div
          className="muted"
          style={{ fontSize: 12, marginTop: 4, display: "flex", gap: 8 }}
        >
          <span>hue {hue}°</span>
          {pending && <span>· saving…</span>}
          {!pending && status === "saved" && (
            <span style={{ color: "var(--green)" }}>· saved ✓</span>
          )}
          {!pending && status === "error" && (
            <span style={{ color: "var(--red)" }}>· save failed</span>
          )}
        </div>
      </div>
    </div>
  );
}
