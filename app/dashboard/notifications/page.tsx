import { prisma } from "@/lib/db/prisma";
import { runStockSweep } from "@/lib/notifications/stock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Bell, CheckCircle } from "lucide-react";

export default async function NotificationsPage() {
  // Refresh stock alerts (out of stock / close to finishing) before listing
  await runStockSweep();

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <div className="space-y-3">
        {notifications.length === 0 && (
          <p className="text-muted-foreground">No notifications yet.</p>
        )}
        {notifications.map((n: typeof notifications[0]) => (
          <Card key={n.id} className={!n.isRead ? "border-l-4 border-l-primary" : ""}>
            <CardContent className="flex items-start gap-3 py-4">
              <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm">{n.title}</p>
                  <Badge variant={n.isRead ? "outline" : "default"}>
                    {n.isRead ? "Read" : "New"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(n.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
