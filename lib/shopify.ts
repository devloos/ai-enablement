import { getToken } from "@vercel/connect";

// Not a secret, just which store to call. The token is the secret, and Connect holds it.
const SHOP_DOMAIN = "i15ape-gd.myshopify.com";
const API_VERSION = "2026-10";
const CONNECTOR = "shopify/ai-enablment-shopify";

/** POST a query to the Shopify Admin GraphQL API using a Vercel Connect token. */
export async function shopifyGraphql<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  // No `scopes` here: Shopify fixes scopes when the app is installed (set them on the connector).
  const token = await getToken(CONNECTOR, {
    subject: { type: "user", id: "brandops-store" },
  });

  const res = await fetch(
    `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      // Shopify uses its own header, not `Authorization: Bearer`.
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  const body = await res.json();

  // Like Slack, GraphQL can return HTTP 200 with an `errors` array.
  if (!res.ok || body.errors) {
    throw new Error(
      `Shopify error (${res.status}): ${JSON.stringify(body.errors ?? body)}`
    );
  }
  return body.data as T;
}

/**
 * Turn the model's product text into a Shopify search string.
 * Strips search syntax (`:`, quotes, parens) so input like "status:draft OR *" can't widen the search.
 */
export function toSearchQuery(product: string) {
  return product
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type InventoryProductNode = {
  title: string;
  totalInventory: number;
  variants: {
    nodes: {
      title: string;
      sku: string | null;
      inventoryQuantity: number | null;
    }[];
  };
};

/** Shape a Shopify product into what the tool returns: total stock plus stock by size. */
export function summarizeInventory(node: InventoryProductNode) {
  return {
    product: node.title,
    totalInventory: node.totalInventory,
    inventoryBySize: Object.fromEntries(
      node.variants.nodes.map((v) => [v.title, v.inventoryQuantity ?? 0])
    ),
  };
}

export const INVENTORY_QUERY = /* GraphQL */ `
  query Inventory($q: String!) {
    products(first: 5, query: $q) {
      nodes {
        title
        totalInventory
        variants(first: 50) {
          nodes {
            title
            sku
            inventoryQuantity
          }
        }
      }
    }
  }
`;
