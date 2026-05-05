type AllBadge = {
  id: string;
  name: string;
  description: string;
  glyph: string;
};

type EarnedBadge = AllBadge & { earnedAt: Date };

export function BadgesGrid({
  all,
  earnedIds,
}: {
  all: AllBadge[];
  earnedIds: Set<string>;
}) {
  return (
    <div className="badges-grid">
      {all.map((b) => {
        const earned = earnedIds.has(b.id);
        return (
          <div key={b.id} className={"badge " + (earned ? "earned" : "locked")}>
            <div className="badge-icon">{b.glyph}</div>
            <div className="badge-name">{b.name}</div>
            <div className="badge-desc">{b.description}</div>
          </div>
        );
      })}
    </div>
  );
}

export type { AllBadge, EarnedBadge };
