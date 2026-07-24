import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient, type StaffDTO } from "./SettingsClient";

export default async function SettingsPage() {
  const { user, ctx } = await requireTenant();
  const business = user.business!;
  const isOwner = ctx.role === "OWNER";

  const courierConfigured = !!(
    await prisma.business.findUnique({
      where: { id: ctx.businessId },
      select: { steadfastApiKey: true },
    })
  )?.steadfastApiKey;

  const staffRows = isOwner
    ? await prisma.user.findMany({
        where: { businessId: ctx.businessId },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, email: true, role: true },
      })
    : [];

  const staff: StaffDTO[] = staffRows.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
  }));

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-sm text-black/50 dark:text-white/50">
        Manage your business profile, password{isOwner ? " and staff" : ""}.
      </p>
      <SettingsClient
        business={{ name: business.name, phone: business.phone, address: business.address }}
        staff={staff}
        isOwner={isOwner}
        courierConfigured={courierConfigured}
      />
    </main>
  );
}
