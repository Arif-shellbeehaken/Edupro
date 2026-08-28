import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/database/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PublicTenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      nameBn: true,
      primaryColor: true,
      logoUrl: true,
      phone: true,
      email: true,
      address: true,
      type: true,
    },
  });
  if (!tenant) notFound();

  const notices = await prisma.notice
    .findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    .catch(() => []);

  const brand = tenant.primaryColor || "#059669";

  return (
    <div className="min-h-screen bg-zinc-50">
      <header
        className="border-b px-6 py-8 text-white"
        style={{ backgroundColor: brand }}
      >
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-4">
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt=""
              className="h-14 w-14 rounded-lg bg-white/20 object-cover"
            />
          ) : null}
          <div>
            <h1 className="text-2xl font-bold">
              {tenant.nameBn || tenant.name}
            </h1>
            <p className="text-sm opacity-90">{tenant.type}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>যোগাযোগ</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {tenant.address && <p>{tenant.address}</p>}
            {tenant.phone && <p>📞 {tenant.phone}</p>}
            {tenant.email && <p>✉️ {tenant.email}</p>}
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button asChild style={{ backgroundColor: brand }}>
            <Link href={`/p/${slug}/admission`}>অনলাইন ভর্তি আবেদন</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>নোটিশ বোর্ড</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-sm text-muted-foreground">নোটিশ নেই</p>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                    {n.body}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.createdAt.toLocaleDateString("bn-BD")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
