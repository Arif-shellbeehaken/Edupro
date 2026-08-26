import { notFound } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { PrintActions } from "./print-actions";

const TYPE_LABEL: Record<string, string> = {
  TRANSFER: "Transfer Certificate",
  CHARACTER: "Character Certificate",
  TESTIMONIAL: "Testimonial",
  HIFZ_COMPLETION: "Hifz Completion Certificate",
  BIRTH: "Birth Certificate",
  OTHER: "Certificate",
};

const TYPE_LABEL_BN: Record<string, string> = {
  TRANSFER: "ট্রান্সফার সার্টিফিকেট",
  CHARACTER: "চারিত্রিক সনদপত্র",
  TESTIMONIAL: "টেস্টিমোনিয়াল",
  HIFZ_COMPLETION: "হিফজ সমাপনী সনদ",
  BIRTH: "জন্ম সনদ",
  OTHER: "সনদপত্র",
};

export default async function CertificatePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.tenantId) notFound();

  const cert = await prisma.certificate.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });
  if (!cert) notFound();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true, nameBn: true, address: true, phone: true },
  });

  const issueDate = cert.issueDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-zinc-100 print:bg-white">
      <PrintActions />

      <div className="mx-auto max-w-[210mm] bg-white p-10 shadow-lg print:shadow-none print:p-12">
        {/* Header */}
        <div className="border-b-2 border-emerald-700 pb-4 text-center">
          <h1 className="text-2xl font-bold text-emerald-800">
            {tenant?.nameBn || tenant?.name || "Institution"}
          </h1>
          {tenant?.nameBn && tenant?.name && (
            <p className="text-sm text-zinc-600">{tenant.name}</p>
          )}
          {tenant?.address && (
            <p className="mt-1 text-xs text-zinc-500">{tenant.address}</p>
          )}
          {tenant?.phone && (
            <p className="text-xs text-zinc-500">Phone: {tenant.phone}</p>
          )}
        </div>

        {/* Title */}
        <div className="my-8 text-center">
          <h2 className="text-xl font-bold uppercase tracking-wide text-zinc-900">
            {TYPE_LABEL[cert.certType] ?? "Certificate"}
          </h2>
          <p className="text-sm text-zinc-600">
            {TYPE_LABEL_BN[cert.certType] ?? "সনদপত্র"}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Certificate No: <span className="font-mono font-semibold">{cert.certificateNo}</span>
          </p>
        </div>

        {/* Body */}
        <div className="space-y-4 text-justify text-[15px] leading-relaxed text-zinc-800">
          <p>
            This is to certify that{" "}
            <strong>{cert.studentNameBn || cert.studentName}</strong>
            {cert.studentNameBn && cert.studentName !== cert.studentNameBn && (
              <> ({cert.studentName})</>
            )}
            {cert.fatherName && (
              <>
                , son/daughter of <strong>{cert.fatherName}</strong>
              </>
            )}
            {cert.className && (
              <>
                , was a student of class <strong>{cert.className}</strong>
              </>
            )}{" "}
            of this institution.
          </p>

          {cert.certType === "CHARACTER" && (
            <p>
              During the period of study, he/she maintained a good character and
              satisfactory academic conduct. We wish him/her every success in
              future endeavours.
            </p>
          )}
          {cert.certType === "TRANSFER" && (
            <>
              <p>
                He/She is hereby released from this institution with effect from{" "}
                <strong>{issueDate}</strong>. All dues payable to the institution
                have been cleared / adjusted as per records. There is nothing on
                record against his/her character or conduct that would debar
                admission elsewhere.
              </p>
              <p>
                এই প্রত্যয়নপত্রটি অন্য শিক্ষাপ্রতিষ্ঠানে ভর্তির জন্য ইস্যু করা
                হলো। উল্লিখিত শিক্ষার্থীকে{" "}
                <strong>{issueDate}</strong> তারিখ থেকে এ প্রতিষ্ঠান থেকে অব্যাহতি
                দেওয়া হলো।
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 rounded border border-zinc-200 p-3 text-sm">
                <p>
                  Certificate No: <strong>{cert.certificateNo}</strong>
                </p>
                <p>
                  Class last attended:{" "}
                  <strong>{cert.className || "—"}</strong>
                </p>
                <p>
                  Status: <strong>Transferred / Released</strong>
                </p>
                <p>
                  Verification:{" "}
                  <strong className="font-mono text-xs">
                    {cert.id.slice(0, 8).toUpperCase()}
                  </strong>
                </p>
              </div>
            </>
          )}
          {cert.certType === "HIFZ_COMPLETION" && (
            <p>
              He/She has successfully completed the Hifz (memorization of the
              Holy Quran) programme under the supervision of this institution.
              May Allah grant him/her success in this world and the hereafter.
            </p>
          )}
          {cert.certType === "TESTIMONIAL" && (
            <p>
              He/She has been a regular student and has shown dedication towards
              studies. This testimonial is issued upon request for official
              purposes.
            </p>
          )}
          {cert.remarks && (
            <p className="text-sm italic text-zinc-600">Note: {cert.remarks}</p>
          )}
        </div>

        {/* Footer signatures */}
        <div className="mt-16 flex justify-between px-4">
          <div className="text-center">
            <div className="mb-8 border-b border-zinc-400 w-40 mx-auto" />
            <p className="text-xs font-medium">Class Teacher</p>
          </div>
          <div className="text-center">
            <div className="mb-8 border-b border-zinc-400 w-40 mx-auto" />
            <p className="text-xs font-medium">Principal / Head</p>
          </div>
        </div>

        <div className="mt-10 text-center text-xs text-zinc-400">
          Issued on {issueDate} · Generated by Edupro
        </div>
      </div>
    </div>
  );
}
