import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { getTenantBranding } from "@/lib/tenant-branding";
import { OnboardingWizard } from "./wizard-form";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.tenantId) redirect("/login");

  const branding = await getTenantBranding(session.user.tenantId);

  if (branding.onboardingDone) {
    redirect("/tenant/admin/dashboard");
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-background px-4 py-12"
      style={
        {
          ["--brand" as string]: branding.primaryColor,
        } as React.CSSProperties
      }
    >
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold" style={{ color: branding.primaryColor }}>
          সেটআপ উইজার্ড
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {session.user.name} · একবারে প্রতিষ্ঠান কনফিগার করুন
        </p>
      </div>
      <OnboardingWizard
        defaults={{
          name: branding.name,
          nameBn: branding.nameBn || "",
          primaryColor: branding.primaryColor,
        }}
      />
    </div>
  );
}
