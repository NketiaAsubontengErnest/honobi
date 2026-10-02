import { getMessages } from "@/actions/messages";
import { MessagesClient } from "./messages-client";

export default async function MessagesPage() {
  const messages = await getMessages();
  const serialized = messages.map((m: typeof messages[0]) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    message: m.message,
    source: m.source,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  }));
  return <MessagesClient messages={serialized} />;
}
