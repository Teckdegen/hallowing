export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompact(value: number) {
  if (value < 1000) return formatNumber(value);
  const compact = value / 1000;
  const digits = compact >= 100 ? 0 : 1;
  return `${compact.toFixed(digits).replace(/\.0$/, "")}K`;
}

export function formatFollowers(value: number) {
  if (value < 10000) return formatNumber(value);
  const compact = value / 1000;
  const digits = compact >= 100 ? 0 : 1;
  return `${compact.toFixed(digits).replace(/\.0$/, "")}K`;
}

export function initials(name: string) {
  const parts = name.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
