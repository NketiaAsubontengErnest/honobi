"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMessage } from "@/actions/messages";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import type { SiteInfo } from "@/lib/site";

export function ContactView({ site }: { site: SiteInfo }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await createMessage({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        subject: formData.get("subject") as string,
        message: formData.get("message") as string,
        source: "website",
      });
      if (res.success) {
        setSuccess(true);
        toast.success("Message sent. We will get back to you soon.");
      } else {
        setError(res.error);
        toast.error(res.error);
      }
    } catch {
      setError("Could not send your message. Please check your connection and try again.");
      toast.error("Could not send your message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-xl text-muted-foreground">
          Get in touch with us for inquiries, quotes, or to discuss your project.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {site.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Workshop Location</h3>
                    <p className="text-sm text-muted-foreground">{site.address}</p>
                  </div>
                </div>
              )}
              {site.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Phone</h3>
                    <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="text-sm text-muted-foreground hover:text-foreground">
                      {site.phone}
                    </a>
                  </div>
                </div>
              )}
              {site.whatsappUrl && (
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">WhatsApp</h3>
                    <a href={site.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                      Chat with us on WhatsApp
                    </a>
                  </div>
                </div>
              )}
              {site.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <a href={`mailto:${site.email}`} className="text-sm text-muted-foreground hover:text-foreground">
                      {site.email}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold">Business Hours</h3>
                  <p className="text-sm text-muted-foreground">Mon - Fri: {site.hours.monFri}</p>
                  <p className="text-sm text-muted-foreground">Saturday: {site.hours.saturday}</p>
                  <p className="text-sm text-muted-foreground">Sunday: {site.hours.sunday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <p className="text-green-600 font-medium">Message sent! We&apos;ll get back to you soon.</p>
            ) : (
              <form action={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" />
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" name="message" required rows={5} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
