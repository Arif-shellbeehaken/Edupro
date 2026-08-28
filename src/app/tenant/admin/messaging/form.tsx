"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  postChatMessageAction,
  type ChatState,
} from "@/application/use-cases/portal/messaging";

export function MessagingForm({ threadKey }: { threadKey: string }) {
  const [state, action, pending] = useActionState(
    postChatMessageAction,
    {} as ChatState
  );
  return (
    <form action={action} className="flex gap-2">
      <input type="hidden" name="threadKey" value={threadKey} />
      <input
        name="body"
        required
        placeholder="মেসেজ লিখুন…"
        className="h-10 flex-1 rounded-lg border px-3 text-sm"
      />
      <Button type="submit" disabled={pending}>
        পাঠান
      </Button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
