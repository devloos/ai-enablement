# BrandOps Outdoor: Inventory & Reorder Policy

Owner: Operations
Last updated: October 2026

## 1. Reorder rule

**Reorder a product when any of its core sizes drops below 30 units.**

- Check stock per size, not the product total. A product can have plenty of stock overall and still be missing the sizes people buy.
- Supplier lead time is **3 weeks** from purchase order to stock in the warehouse.

## 2. Core sizes

Core sizes are the ones that make up most of our sales.

| Product | Core sizes |
| --- | --- |
| Trail Runner | 9, 9.5, 10, 10.5, 11 |
| Summit Shell Jacket | M, L |
| Ridgeline Fleece | M, L |
| Basecamp Hiking Pant | 32, 34 |
| Merino Trail Sock | M |

Non-core sizes still get restocked, but only during the monthly review (section 5).

## 3. Size curve: Trail Runner

- Sizes **9 to 10.5 make up about 55% of Trail Runner sales.**
- When one of these sizes runs low, Trail Runner sales drop, even if other sizes are in stock. Customers rarely switch sizes; they leave.
- A drop in Trail Runner sales should always be checked against stock in sizes 9 to 10.5 first.

## 4. How much to reorder

Order enough to cover **6 weeks of sales** for that size:

> Reorder quantity = (units sold last 7 days × 6) − units in stock

- 6 weeks = 3 weeks of lead time + 3 weeks of buffer.
- Round up to the nearest 10.

Example: Trail Runner size 9.5 sold 44 units last week and has 18 in stock.
(44 × 6) − 18 = 246 → **order 250**.

## 5. Monthly review

On the first Monday of each month, Operations reviews every size of every product, core and non-core, and places any reorders not already covered.

## 6. Approvals

- Any reorder over **500 units** needs approval from the Operations lead.
- Stock levels in Shopify are changed **only** after a person approves the change. Automated tools and AI assistants may suggest changes but must never change stock on their own.

## 7. Alerts

- Post low-stock alerts in the **#ops** Slack channel.
- Include: product, size, units in stock, and the suggested reorder quantity.
