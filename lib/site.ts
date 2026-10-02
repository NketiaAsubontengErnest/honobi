// Single source of truth for public contact details (override via NEXT_PUBLIC_* env vars).
const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "233241234567").replace(/\D/g, "");

export const site = {
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+233 24 123 4567",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@honobi.com",
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "Tema, Greater Accra, Ghana",
  whatsappUrl: `https://wa.me/${whatsapp}`,
};
