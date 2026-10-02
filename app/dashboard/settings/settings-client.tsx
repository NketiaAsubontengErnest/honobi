"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSetting, sendTestEmail } from "@/actions/settings";

type Setting = {
  id: string;
  key: string;
  value: string;
  type: string;
  group: string;
};

const groupLabels: Record<string, string> = {
  email: "Email / SMTP",
  general: "General",
  business: "Business Info",
  invoice: "Invoice Settings",
  social: "Social Media",
  hours: "Business Hours",
};

const groupOrder = ["email", "general", "business", "invoice", "social", "hours"];

const hints: Record<string, string> = {
  smtp_host: "e.g. smtp.gmail.com",
  smtp_port: "587 (STARTTLS) or 465 (SSL)",
  smtp_secure: "true for port 465, false for 587",
  smtp_user: "SMTP username (usually the email address)",
  smtp_password: "SMTP password or app password (stored on the server, never shown again)",
  smtp_from_name: "Sender display name",
  smtp_from_email: "Sender address (defaults to the SMTP user)",
  notification_emails: "Comma-separated addresses that receive new contact messages and quote requests",
};

export function SettingsClient({ settings }: { settings: Setting[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.id, s.value]))
  );
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const grouped = settings.reduce<Record<string, Setting[]>>((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {});
  const groups = Object.keys(grouped).sort(
    (a, b) => (groupOrder.indexOf(a) === -1 ? 99 : groupOrder.indexOf(a)) - (groupOrder.indexOf(b) === -1 ? 99 : groupOrder.indexOf(b))
  );

  const handleSave = async (id: string) => {
    setError(null);
    try {
      await updateSetting(id, values[id] ?? "");
      setSaved("Saved!");
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  };

  // Save every email field, then send the test message
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      for (const s of grouped.email ?? []) {
        await updateSetting(s.id, values[s.id] ?? "");
      }
      setTestResult(await sendTestEmail(testTo || undefined));
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        {saved && <span className="text-sm text-green-600">{saved}</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>

      {groups.map((group) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle>{groupLabels[group] ?? group}</CardTitle>
            {group === "email" && (
              <p className="text-sm text-muted-foreground">
                New contact messages and quote requests are emailed to the addresses listed in
                &ldquo;notification emails&rdquo; using this SMTP account.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {grouped[group].map((s) => (
              <div key={s.id} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs capitalize">{s.key.replace(/_/g, " ")}</Label>
                  <Input
                    type={s.key.includes("password") ? "password" : "text"}
                    autoComplete="off"
                    value={values[s.id] ?? s.value}
                    onChange={(e) => setValues((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  />
                  {hints[s.key] && <p className="mt-1 text-xs text-muted-foreground">{hints[s.key]}</p>}
                </div>
                <Button size="sm" variant="outline" onClick={() => handleSave(s.id)}>Save</Button>
              </div>
            ))}

            {group === "email" && (
              <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-medium">Send a test email</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="email"
                    placeholder="Send to (defaults to your account email)"
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                  />
                  <Button onClick={handleTest} disabled={testing}>
                    {testing ? "Sending..." : "Save & send test"}
                  </Button>
                </div>
                {testResult && (
                  <p className={`text-sm ${testResult.ok ? "text-green-600" : "text-destructive"}`}>{testResult.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
