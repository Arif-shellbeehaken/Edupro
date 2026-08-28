import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/infrastructure/database/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Public white-label micro-site for each tenant.
 * /s/{slug} — about, notices, admission CTA (no auth)
 */
export default async function PublicTenantSite({
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
      type: true,
      address: true,
      phone: true,
      email: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
    },
  });
  if (!tenant) notFound();

  const notices = await prisma.notice.findMany({
    where: { tenantId: tenant.id, isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: 8,
  });

  const primary = tenant.primaryColor || "#059669";
  const title = tenant.nameBn || tenant.name;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header
        className="border-b text-white"
        style={{ backgroundColor: primary }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-6">
          <div className="flex items-center gap-3">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logoUrl}
                alt=""
                className="h-12 w-12 rounded-lg bg-white/20 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 text-lg font-bold">
                {title.slice(0, 1)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="text-xs opacity-90">{tenant.type}</p>
            </div>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/login">স্টাফ লগইন</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>আমাদের সম্পর্কে</CardTitle>
            <CardDescription>{tenant.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {tenant.address && <p>ঠিকানা: {tenant.address}</p>}
            {tenant.phone && <p>ফোন: {tenant.phone}</p>}
            {tenant.email && <p>ইমেইল: {tenant.email}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>নোটিশ বোর্ড</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-sm text-muted-foreground">এখনো নোটিশ নেই</p>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="rounded-lg border px-3 py-2">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {n.body}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader>
            <CardTitle>ভর্তি আবেদন</CardTitle>
            <CardDescription>
              অনলাইন আবেদনের জন্য প্রতিষ্ঠানে যোগাযোগ করুন বা প্যারেন্ট পোর্টাল ব্যবহার করুন
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/parent/login">প্যারেন্ট পোর্টাল</Link>
            </Button>
            {tenant.phone && (
              <Button variant="outline" asChild>
                <a href={`tel:${tenant.phone}`}>কল করুন</a>
              </Button>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Powered by Edupro · /s/{slug}
      </footer>
    </div>
  );
}
