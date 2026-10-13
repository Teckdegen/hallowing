export type Gift = {
  id: number;
  slug: string;
  name: string;
  price: number;
};

export const gifts: Gift[] = [
  { id: 0, slug: "candy-corn", name: "Candy Corn", price: 50_000 },
  { id: 1, slug: "little-boo", name: "Little Boo", price: 100_000 },
  { id: 2, slug: "pumpkin-puff", name: "Pumpkin Puff", price: 250_000 },
  { id: 3, slug: "batty", name: "Batty", price: 500_000 },
  { id: 4, slug: "midnight-cat", name: "Midnight Cat", price: 1_000_000 },
  { id: 5, slug: "witchy-brew", name: "Witchy Brew", price: 2_500_000 },
  { id: 6, slug: "moonlit-broom", name: "Moonlit Broom", price: 5_000_000 },
  { id: 7, slug: "spirit-lantern", name: "Spirit Lantern", price: 10_000_000 },
  { id: 8, slug: "skeleton-dance", name: "Skeleton Dance", price: 25_000_000 },
  { id: 9, slug: "haunted-manor", name: "Haunted Manor", price: 50_000_000 },
];

export const maxGiftQuantity = 99;

export function giftImage(gift: Gift) {
  return `/gifts/${gift.slug}.png`;
}

export function shortTokens(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toString().replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toString().replace(/\.0$/, "")}K`;
  return String(value);
}

export function giftLabel(gift: Gift, quantity: number) {
  return quantity === 1 ? gift.name : `${quantity} ${gift.name}${/s$/.test(gift.name) ? "" : "s"}`;
}
