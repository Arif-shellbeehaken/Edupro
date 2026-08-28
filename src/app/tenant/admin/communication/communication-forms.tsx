"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  sendMessageAction,
  createNoticeAction,
  type ActionState,
} from "@/application/use-cases/crm/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const textareaClass =
  "flex min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CommunicationForms({
  classes = [],
}: {
  classes?: { id: string; name: string; nameBn: string | null }[];
}) {
  const [msgState, msgAction, msgPending] = useActionState(
    sendMessageAction,
    {} as ActionState
  );
  const [noticeState, noticeAction, noticePending] = useActionState(
    createNoticeAction,
    {} as ActionState
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SMS / মেসেজ পাঠান</CardTitle>
          <CardDescription>
            একক · ক্লাসভিত্তিক bulk · সব অভিভাবক
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={msgAction} className="space-y-2">
            <select name="channel" className={inputClass} defaultValue="SMS">
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
            </select>
            <input
              name="recipient"
              placeholder="ফোন / ইমেইল (একক পাঠাতে)"
              className={inputClass}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="bulk" value="true" />
              Bulk SMS (অভিভাবক)
            </label>
            <select name="classId" className={inputClass} defaultValue="">
              <option value="">সব ক্লাস (পুরো প্রতিষ্ঠান)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn || c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Bulk + ক্লাস সিলেক্ট = শুধু সেই ক্লাসের অভিভাবক · ক্লাস খালি = সবাই
            </p>
            <input name="subject" placeholder="বিষয় (ঐচ্ছিক)" className={inputClass} />
            <textarea
              name="body"
              required
              placeholder="মেসেজ *"
              className={textareaClass}
            />
            {msgState.error && (
              <p className="text-xs text-red-600">{msgState.error}</p>
            )}
            {msgState.success && (
              <p className="text-xs text-emerald-600">{msgState.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={msgPending}>
              {msgPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "পাঠান"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">নোটিশ বোর্ড</CardTitle>
          <CardDescription>প্রতিষ্ঠান-wide ঘোষণা</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={noticeAction} className="space-y-2">
            <input name="title" required placeholder="শিরোনাম *" className={inputClass} />
            <input name="titleBn" placeholder="বাংলা শিরোনাম" className={inputClass} />
            <select name="audience" className={inputClass} defaultValue="ALL">
              <option value="ALL">সবাই</option>
              <option value="STUDENTS">শিক্ষার্থী</option>
              <option value="STAFF">স্টাফ</option>
              <option value="PARENTS">অভিভাবক</option>
            </select>
            <textarea name="body" required placeholder="বিবরণ *" className={textareaClass} />
            {noticeState.error && (
              <p className="text-xs text-red-600">{noticeState.error}</p>
            )}
            {noticeState.success && (
              <p className="text-xs text-emerald-600">নোটিশ প্রকাশিত</p>
            )}
            <Button type="submit" className="w-full" disabled={noticePending}>
              {noticePending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "প্রকাশ"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
