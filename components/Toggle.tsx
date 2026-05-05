"use client";

export function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div
      className={"toggle" + (on ? " on" : "")}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
    />
  );
}
