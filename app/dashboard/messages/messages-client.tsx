"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateMessageStatus } from "@/actions/messages";
import { formatDate } from "@/lib/utils";

type Message = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string | null;
  status: string;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  READ: "bg-gray-100 text-gray-800",
  REPLIED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-500",
};

export function MessagesClient({ messages }: { messages: Message[] }) {
  const [data, setData] = useState(messages);
  const [filter, setFilter] = useState<string>("ALL");
  const visible = filter === "ALL" ? data : data.filter((m) => m.status === filter);
  const count = (st: string) => (st === "ALL" ? data.length : data.filter((m) => m.status === st).length);

  const handleStatusChange = async (id: string, status: string) => {
    await updateMessageStatus(id, status);
    setData((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Contact Messages</h1>

      <div className="flex flex-wrap gap-2">
        {["ALL", "NEW", "READ", "REPLIED", "CLOSED"].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`rounded-full border px-3 py-1 text-xs ${filter === st ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()} ({count(st)})
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-lg font-medium">{data.length === 0 ? "No messages yet" : "No messages in this view"}</p>
            <p className="text-sm text-muted-foreground">
              {data.length === 0
                ? "Messages sent from the website contact form will appear here, and are also emailed to the addresses set in Settings → Email / SMTP."
                : "Try another status filter."}
            </p>
            {data.length === 0 && (
              <a href="/contact" target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-primary underline">
                Open the public contact form
              </a>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {visible.map((msg) => (
          <Card key={msg.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{msg.subject ?? "No Subject"}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {msg.name} · {msg.email ?? msg.phone ?? "No contact"} · {formatDate(msg.createdAt)}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[msg.status] ?? ""}`}>
                  {msg.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">{msg.message}</p>
              <div className="flex gap-2">
                {msg.status === "NEW" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(msg.id, "READ")}>Mark Read</Button>
                )}
                {msg.status !== "CLOSED" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(msg.id, "CLOSED")}>Close</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
