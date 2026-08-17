import { prisma } from "@/lib/prisma";
import { mainHosts } from "@/lib/host";

// Caddy on-demand TLS "ask" endpoint: returns 200 only for hostnames we serve,
// so certificates are never issued for random domains pointed at the server.
//   on_demand_tls { ask http://localhost:3000/api/verify-domain }
export async function GET(req: Request) {
  const domain = new URL(req.url).searchParams.get("domain")?.toLowerCase().trim();
  if (!domain) return new Response("missing domain", { status: 400 });

  if (mainHosts().includes(domain)) return new Response("ok");

  const biz = await prisma.business.findUnique({
    where: { hostname: domain },
    select: { id: true },
  });
  return biz ? new Response("ok") : new Response("unknown host", { status: 404 });
}
