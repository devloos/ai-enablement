// Baked-in company docs. Swap for a real doc store (Drive, Notion, ...) later;
// the tool's output shape can stay the same.

type CompanyDoc = {
  id: string;
  title: string;
  text: string;
  // Extra search words that aren't in the text.
  tags: string[];
};

const DOCS: CompanyDoc[] = [
  {
    id: "reorder-rule",
    title: "Reorder policy",
    text: "Reorder a product when any of its core sizes drops below 30 units. Check stock per size, not the product total. Supplier lead time is 3 weeks from purchase order to stock in the warehouse.",
    tags: ["restock", "low stock", "inventory", "threshold", "lead time"],
  },
  {
    id: "core-sizes",
    title: "Core sizes",
    text: "Core sizes make up most of our sales. Trail Runner: 9, 9.5, 10, 10.5, 11. Summit Shell Jacket: M, L. Ridgeline Fleece: M, L. Basecamp Hiking Pant: 32, 34. Merino Trail Sock: M. Non-core sizes are restocked only during the monthly review.",
    tags: ["inventory", "restock", "jacket", "fleece", "pant", "sock"],
  },
  {
    id: "size-curve-trail-runner",
    title: "Size curve: Trail Runner",
    text: "Sizes 9 to 10.5 make up about 55% of Trail Runner sales. When one of these sizes runs low, Trail Runner sales drop even if other sizes are in stock; customers rarely switch sizes. Always check a Trail Runner sales drop against stock in sizes 9 to 10.5 first.",
    tags: ["shoe", "footwear", "sales drop", "decline", "why"],
  },
  {
    id: "reorder-quantity",
    title: "How much to reorder",
    text: "Order enough to cover 6 weeks of sales for that size: reorder quantity = (units sold last 7 days × 6) − units in stock, rounded up to the nearest 10. 6 weeks is 3 weeks of lead time plus 3 weeks of buffer. Example: Trail Runner size 9.5 sold 44 units last week with 18 in stock: (44 × 6) − 18 = 246, so order 250.",
    tags: ["restock", "formula", "amount", "purchase order"],
  },
  {
    id: "monthly-review",
    title: "Monthly inventory review",
    text: "On the first Monday of each month, Operations reviews every size of every product, core and non-core, and places any reorders not already covered.",
    tags: ["inventory", "restock", "schedule"],
  },
  {
    id: "approvals",
    title: "Approvals for stock changes",
    text: "Any reorder over 500 units needs approval from the Operations lead. Stock levels in Shopify are changed only after a person approves the change. Automated tools and AI assistants may suggest changes but must never change stock on their own.",
    tags: ["permission", "approve", "shopify", "inventory", "agent", "write"],
  },
  {
    id: "low-stock-alerts",
    title: "Low-stock alerts",
    text: "Post low-stock alerts in the #ops Slack channel. Include the product, size, units in stock, and the suggested reorder quantity.",
    tags: ["slack", "notify", "message", "ops", "restock"],
  },
  {
    id: "returns-policy",
    title: "Returns policy",
    text: "Customers can return unworn items within 30 days for a full refund. Worn footwear can be exchanged for a different size within 14 days.",
    tags: ["refund", "exchange", "customer"],
  },
];

// Words too common to help ranking.
const STOP_WORDS = new Set([
  "the", "and", "for", "what", "how", "why", "when", "our", "are", "is", "do", "does",
  "of", "to", "a", "an", "in", "on", "we", "with", "about", "policy",
]);

function terms(query: string) {
  return query
    .toLowerCase()
    .split(/[^\p{L}\p{N}.]+/u)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    // Drop single letters ("m" matches almost everything), but keep sizes like "9".
    .filter((t) => (t.length > 1 || /\d/.test(t)) && !STOP_WORDS.has(t));
}

/** Rank docs by how many query words they contain. Returns the top `limit` matches. */
export function searchDocs(query: string, limit = 3) {
  const words = terms(query);
  return DOCS.map((doc) => {
    const haystack = `${doc.title} ${doc.text} ${doc.tags.join(" ")}`.toLowerCase();
    const score = words.filter((w) => haystack.includes(w)).length;
    return { doc, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc }) => ({ id: doc.id, title: doc.title, text: doc.text }));
}

export const DOC_TITLES = DOCS.map((d) => d.title);
