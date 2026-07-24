import { prisma } from "@/lib/prisma";

// Steadfast delivery-status webhook.
// Configure the portal to POST here with a shared secret:
//   https://<app>/api/courier/steadfast/webhook?token=<COURIER_WEBHOOK_SECRET>
// Fail-closed if the token is missing or wrong.

export async function POST(req: Request) {
  const secret = process.env.COURIER_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 503 });

  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? req.headers.get("x-webhook-token");
  if (token !== secret) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return new Response("Bad request", { status: 400 });

  const consignmentId = body.consignment_id != null ? String(body.consignment_id) : null;
  const status = body.status ? String(body.status) : null;
  if (!consignmentId || !status) return new Response("Missing fields", { status: 400 });

  // Match by consignment id (courierRef). Map a delivered status onto the order too.
  const orderStatus =
    status === "delivered"
      ? "delivered"
      : status === "cancelled" || status === "returned"
      ? "returned"
      : undefined;

  await prisma.order.updateMany({
    where: { courierRef: consignmentId, courier: "steadfast" },
    data: { courierStatus: status, ...(orderStatus ? { status: orderStatus } : {}) },
  });

  return Response.json({ ok: true });
}
