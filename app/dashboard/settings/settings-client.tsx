"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSetting, sendTestEmail } from "@/actions/settings";
import { cn } from "@/lib/utils";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";

type Setting = {
  id: string;
  key: string;
  value: string;
  type: string;
  group: string;
};

type TabId = "general" | "contact" | "invoice" | "email" | "other";

const TABS: { id: TabId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "contact", label: "Contact" },
  { id: "invoice", label: "Invoice" },
  { id: "email", label: "Email / SMTP" },
];

/** Section titles per tab; keys are matched by prefix. */
const CONTACT_SECTIONS: { title: string; match: (k: string) => boolean }[] = [
  { title: "Contact details", match: (k) => k.startsWith("business_") },
  { title: "Business hours", match: (k) => k.startsWith("hours_") },
  { title: "Social media", match: (k) => k.startsWith("social_") },
];

const CONTACT_ORDER = [
  "business_phone", "business_whatsapp", "business_email", "business_address", "business_region", "business_country",
  "hours_mon_fri", "hours_saturday", "hours_sunday",
  "social_facebook", "social_instagram", "social_tiktok",
];

const GENERAL_ORDER = ["business_logo", "business_name", "business_description", "currency", "hero_title", "hero_description", "tax_enabled", "tax_rate"];

function tabOf(s: Setting): TabId {
  if (s.group === "email") return "email";
  if (s.group === "invoice") return "invoice";
  if (s.key.startsWith("hours_") || s.key.startsWith("social_")) return "contact";
  if (["business_phone", "business_whatsapp", "business_email", "business_address", "business_region", "business_country"].includes(s.key)) return "contact";
  if (s.group === "general" || s.group === "business") return "general";
  return "other";
}

const LABELS: Record<string, string> = {
  business_logo: "Logo",
  business_name: "Business name",
  business_description: "Business description (About page)",
  business_phone: "Phone number",
  business_whatsapp: "WhatsApp number",
  business_email: "Public email address",
  business_address: "Street address",
  business_region: "Region / city",
  business_country: "Country",
  hours_mon_fri: "Monday – Friday",
  hours_saturday: "Saturday",
  hours_sunday: "Sunday",
  social_facebook: "Facebook page URL",
  social_instagram: "Instagram URL",
  social_tiktok: "TikTok URL",
  smtp_host: "SMTP host",
  smtp_port: "SMTP port",
  smtp_secure: "Use SSL (secure)",
  smtp_user: "SMTP username",
  smtp_password: "SMTP password",
  smtp_from_name: "Sender name",
  smtp_from_email: "Sender email address",
  notification_emails: "Notification emails",
};

const HINTS: Record<string, string> = {
  business_phone: "Shown on the website footer and Contact page",
  business_whatsapp: "Digits only with country code, e.g. 233241234567. Powers the WhatsApp buttons.",
  business_email: "Shown on the website and on invoices",
  business_address: "Shown on the Contact page and footer",
  smtp_host: "e.g. smtp.gmail.com",
  smtp_port: "587 (STARTTLS) or 465 (SSL)",
  smtp_secure: "true for port 465, false for 587",
  smtp_user: "Usually the email address",
  smtp_password: "SMTP or app password. Stored on the server and never shown again.",
  smtp_from_email: "Defaults to the SMTP username",
  notification_emails: "Comma-separated addresses that receive new contact messages and quote requests",
};

function labelFor(key: string) {
  return LABELS[key] ?? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function sortBy(order: string[]) {
  return (a: Setting, b: Setting) => {
    const ia = order.indexOf(a.key);
    const ib = order.indexOf(b.key);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.key.localeCompare(b.key);
  };
}

export function SettingsClient({ settings }: { settings: Setting[] }) {
  const [tab, setTab] = useState<TabId>("general");
  const [saved, setSaved] = useState<Record<string, string>>(Object.fromEntries(settings.map((s) => [s.id, s.value])));
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(settings.map((s) => [s.id, s.value])));
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);

  const byTab = useMemo(() => {
    const map: Record<TabId, Setting[]> = { general: [], contact: [], invoice: [], email: [], other: [] };
    settings.forEach((s) => map[tabOf(s)].push(s));
    map.general.sort(sortBy(GENERAL_ORDER));
    map.contact.sort(sortBy(CONTACT_ORDER));
    return map;
  }, [settings]);

  const tabs = byTab.other.length ? [...TABS, { id: "other" as TabId, label: "Other" }] : TABS;
  const dirtyIn = (id: TabId) => byTab[id].filter((s) => values[s.id] !== saved[s.id]);

  async function saveTab(id: TabId) {
    const dirty = dirtyIn(id);
    if (dirty.length === 0) {
      toast.info("No changes to save");
      return;
    }
    setSaving(true);
    try {
      for (const s of dirty) await updateSetting(s.id, values[s.id] ?? "");
      setSaved((prev) => ({ ...prev, ...Object.fromEntries(dirty.map((s) => [s.id, values[s.id] ?? ""])) }));
      toast.success(`${dirty.length} setting${dirty.length === 1 ? "" : "s"} saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      for (const s of dirtyIn("email")) await updateSetting(s.id, values[s.id] ?? "");
      setSaved((prev) => ({ ...prev, ...Object.fromEntries(byTab.email.map((s) => [s.id, values[s.id] ?? ""])) }));
      const res = await sendTestEmail(testTo || undefined);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  function field(s: Setting) {
    if (s.key === "business_logo") {
      return (
        <div key={s.id} className="md:col-span-2">
          <Label className="text-sm">Business logo</Label>
          <div className="mt-2">
            <ImageUploadField
              name="business_logo"
              target="logo"
              variant="logo"
              initialUrl={saved[s.id] ?? ""}
              onChange={(url) => setValues((p) => ({ ...p, [s.id]: url }))}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Shown in the website header and footer, the dashboard, the sign-in page and on invoices. PNG with a transparent background works best. Press Save changes after uploading.
          </p>
        </div>
      );
    }
    const isBool = s.type === "boolean" || s.key === "smtp_secure";
    return (
      <div key={s.id}>
        <Label htmlFor={`s-${s.id}`} className="text-sm">{labelFor(s.key)}</Label>
        {isBool ? (
          <select
            id={`s-${s.id}`}
            value={values[s.id] === "true" ? "true" : "false"}
            onChange={(e) => setValues((p) => ({ ...p, [s.id]: e.target.value }))}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        ) : (
          <Input
            id={`s-${s.id}`}
            className="mt-1"
            type={s.key.includes("password") ? "password" : "text"}
            autoComplete="off"
            value={values[s.id] ?? ""}
            onChange={(e) => setValues((p) => ({ ...p, [s.id]: e.target.value }))}
          />
        )}
        {HINTS[s.key] && <p className="mt-1 text-xs text-muted-foreground">{HINTS[s.key]}</p>}
      </div>
    );
  }

  const current = byTab[tab];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div role="tablist" className="flex flex-wrap gap-1 border-b">
        {tabs.map((t) => {
          const dirty = dirtyIn(t.id).length;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {dirty > 0 && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-orange-500" title="Unsaved changes" />}
            </button>
          );
        })}
      </div>

      {tab === "contact" ? (
        <div className="space-y-6">
          {CONTACT_SECTIONS.map((sec) => {
            const items = current.filter((s) => sec.match(s.key));
            if (!items.length) return null;
            return (
              <Card key={sec.title}>
                <CardHeader>
                  <CardTitle className="text-base">{sec.title}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">{items.map(field)}</CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tabs.find((t) => t.id === tab)?.label}</CardTitle>
            {tab === "email" && (
              <p className="text-sm text-muted-foreground">
                New contact messages and quote requests are emailed to the &ldquo;notification emails&rdquo; using this SMTP account.
              </p>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {current.map(field)}
            {current.length === 0 && <p className="text-sm text-muted-foreground">No settings here yet.</p>}
          </CardContent>
        </Card>
      )}

      {tab === "email" && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm font-medium">Send a test email</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="Send to (defaults to your account email)"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
              />
              <Button variant="outline" onClick={handleTest} disabled={testing || saving}>
                {testing ? "Sending..." : "Save & send test"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={() => saveTab(tab)} disabled={saving || dirtyIn(tab).length === 0}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
        {dirtyIn(tab).length > 0 && <span className="text-sm text-muted-foreground">{dirtyIn(tab).length} unsaved</span>}
      </div>
    </div>
  );
}
