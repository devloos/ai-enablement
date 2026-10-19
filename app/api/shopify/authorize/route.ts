import { startAuthorization } from "@vercel/connect";

export async function GET() {
  const { url } = await startAuthorization("shopify/ai-enablment-shopify", {
    subject: { type: "user", id: "brandops-store" },
  });
  return Response.redirect(url);
}
