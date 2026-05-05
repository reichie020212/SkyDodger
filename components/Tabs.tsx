"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type TabOption = { value: string; label: string };

export function Tabs({
  options,
  paramName,
  current,
  defaultValue,
}: {
  options: TabOption[];
  paramName: string;
  current: string;
  defaultValue: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultValue) {
      params.delete(paramName);
    } else {
      params.set(paramName, value);
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="tabs">
      {options.map((opt) => (
        <Link
          key={opt.value}
          href={hrefFor(opt.value)}
          className={"tab" + (current === opt.value ? " active" : "")}
          scroll={false}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
