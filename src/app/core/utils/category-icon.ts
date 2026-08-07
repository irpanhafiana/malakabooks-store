export function getCategoryIcon(code: string | null | undefined): string {
  const mapping: Record<string, string> = {
    "101": "bx-building-house",
    "102": "bx-wind",
    "103": "bx-home-alt",
    "104": "bx-spray-can",
    "105": "bx-bowl-hot",
    "106": "bx-drink",
    "107": "bxs-baby-carriage",
    "108": "bx-category",
    "110": "bx-receipt"
  };
  return mapping[code || ''] || "bx-book-open";
}
