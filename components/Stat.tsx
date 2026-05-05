export function Stat({
  label,
  value,
  trend,
}: {
  label: string;
  value: string | number;
  trend?: string;
}) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {trend && <div className="stat-trend">{trend}</div>}
    </div>
  );
}
