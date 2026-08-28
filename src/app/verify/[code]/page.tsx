import { prisma } from "@/infrastructure/database/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function VerifyCertPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cert = await prisma.certificate.findFirst({
    where: { verificationCode: code, status: "ISSUED" },
  });

  if (!cert) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 text-center text-red-600">
            সার্টিফিকেট যাচাই হয়নি / অবৈধ কোড
          </CardContent>
        </Card>
      </div>
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: cert.tenantId },
    select: { name: true, nameBn: true },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            সার্টিফিকেট যাচাই
            <Badge variant="success">বৈধ</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">প্রতিষ্ঠান: </span>
            {tenant?.nameBn || tenant?.name}
          </p>
          <p>
            <span className="text-muted-foreground">নম্বর: </span>
            {cert.certificateNo}
          </p>
          <p>
            <span className="text-muted-foreground">ধরন: </span>
            {cert.certType}
          </p>
          <p>
            <span className="text-muted-foreground">নাম: </span>
            {cert.studentNameBn || cert.studentName}
          </p>
          {cert.className && (
            <p>
              <span className="text-muted-foreground">ক্লাস: </span>
              {cert.className}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">ইস্যু: </span>
            {cert.issueDate.toLocaleDateString("bn-BD")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
