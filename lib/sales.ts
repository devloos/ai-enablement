// Mock sales data. Products, prices, and sizes match the Shopify dev store.
// Swap this for real order data later; the tool's output shape can stay the same.

type WeekSales = { units: number; bySize: Record<string, number> };

type ProductSales = {
  title: string;
  price: number;
  thisWeek: WeekSales;
  lastWeek: WeekSales;
};

const SALES: ProductSales[] = [
  {
    title: "Trail Runner",
    price: 140,
    // Sizes 9-10.5 are ~55% of sales (see "Size curve" doc).
    // 9.5 and 10.5 dropped this week because they're low on stock.
    thisWeek: { units: 312, bySize: { "8": 30, "9": 46, "9.5": 44, "10": 48, "10.5": 34, "11": 62, "12": 48 } },
    lastWeek: { units: 416, bySize: { "8": 36, "9": 58, "9.5": 70, "10": 62, "10.5": 64, "11": 74, "12": 52 } },
  },
  {
    title: "Summit Shell Jacket",
    price: 260,
    thisWeek: { units: 58, bySize: { S: 9, M: 21, L: 18, XL: 10 } },
    lastWeek: { units: 49, bySize: { S: 8, M: 17, L: 15, XL: 9 } },
  },
  {
    title: "Ridgeline Fleece",
    price: 120,
    thisWeek: { units: 141, bySize: { S: 22, M: 48, L: 45, XL: 26 } },
    lastWeek: { units: 133, bySize: { S: 21, M: 45, L: 42, XL: 25 } },
  },
  {
    title: "Basecamp Hiking Pant",
    price: 95,
    thisWeek: { units: 87, bySize: { "30": 15, "32": 31, "34": 27, "36": 14 } },
    lastWeek: { units: 102, bySize: { "30": 18, "32": 36, "34": 32, "36": 16 } },
  },
  {
    title: "Merino Trail Sock",
    price: 22,
    thisWeek: { units: 405, bySize: { S: 96, M: 187, L: 122 } },
    lastWeek: { units: 380, bySize: { S: 90, M: 176, L: 114 } },
  },
];

export const PRODUCT_TITLES = SALES.map((p) => p.title);

/** Case-insensitive lookup, so "trail runner" finds "Trail Runner". Returns null if unknown. */
export function getSalesSummary(product: string) {
  const query = product.trim().toLowerCase();
  const match = SALES.find((p) => p.title.toLowerCase().includes(query));
  if (!query || !match) return null;

  const { title, price, thisWeek, lastWeek } = match;
  const changePercent =
    Math.round(((thisWeek.units - lastWeek.units) / lastWeek.units) * 1000) / 10;

  return {
    product: title,
    period: "last 7 days vs previous 7 days",
    thisWeek: { units: thisWeek.units, revenue: thisWeek.units * price },
    lastWeek: { units: lastWeek.units, revenue: lastWeek.units * price },
    changePercent,
    unitsBySize: { thisWeek: thisWeek.bySize, lastWeek: lastWeek.bySize },
  };
}
