import { notFound } from "next/navigation";
import { getInvoiceById } from "@/actions/invoices";
import { getAllSettingsMap } from "@/actions/settings";
import { PrintButton } from "@/components/dashboard/print-button";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const invoice = await getInvoiceById(id);
  if (!invoice || !invoice.isActive) notFound();

  const settings = await getAllSettingsMap();
  const business = {
    name: settings.business_name || "HONOBI WOOD JOINERY",
    logo: settings.business_logo || "",
    phone: settings.business_phone || "",
    email: settings.business_email || "",
    address: settings.business_address || "",
    region: settings.business_region || "",
    country: settings.business_country || "",
  };
  const currency = settings.currency || "GHS";
  const footer = settings.invoice_footer || "Thank you for choosing HONOBI WOOD JOINERY!";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = invoice.items;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payments: any[] = invoice.payments;
  const customer = invoice.customer as any;

  return (
    <div className="space-y-6">
      {/* Screen-only toolbar */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Invoice {invoice.invoiceNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Link>
          </Button>
          <PrintButton autoPrint={print === "1"} />
        </div>
      </div>

      {/* Print-only styles: A4 sheet, hide dashboard chrome */}
      <style>{`
        @page { size: A4 portrait; margin: 14mm; }
        @media print {
          body * { visibility: hidden !important; }
          .invoice-print, .invoice-print * { visibility: visible !important; }
          .invoice-print {
            position: absolute !important; left: 0 !important; top: 0 !important;
            width: 100% !important; box-shadow: none !important; border: none !important;
          }
        }
      `}</style>

      {/* The invoice document */}
      <div className="invoice-print bg-white text-black shadow-md rounded-lg p-8 max-w-[210mm] mx-auto print:shadow-none print:p-0 print:max-w-none">
        {/* Letterhead */}
        <header className="flex items-start justify-between gap-6 border-b-4 border-amber-700 pb-5" style={{ borderBottomColor: "#8a5a2b" }}>
          <div className="flex items-center gap-4">
            {business.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo} alt={`${business.name} logo`} className="h-14 w-auto max-w-[8rem] object-contain shrink-0" />
            ) : (
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, #b07a44, #7a4a22)" }}
              >
                H
              </div>
            )}
            <div>
              <p className="text-2xl font-bold tracking-wide">{business.name}</p>
              <p className="text-sm text-gray-600">Crafting Excellence in Wood</p>
              <p className="text-xs text-gray-500 mt-1">
                {[business.address, business.region, business.country].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold text-lg uppercase">Invoice</p>
            <p className="font-mono">{invoice.invoiceNumber}</p>
            <p className="mt-1 text-xs">{business.phone}</p>
            <p className="text-xs">{business.email}</p>
          </div>
        </header>

        {/* Meta + Bill To */}
        <section className="flex justify-between gap-8 mt-6 text-sm">
          <div>
            <p className="font-bold uppercase text-xs text-gray-500 mb-1">Billed To</p>
            <p className="font-semibold">{customer?.name}</p>
            {customer?.phone && <p>{customer.phone}</p>}
            {customer?.email && <p>{customer.email}</p>}
            {(customer?.address || customer?.city || customer?.region) && (
              <p>{[customer?.address, customer?.city, customer?.region].filter(Boolean).join(", ")}</p>
            )}
          </div>
          <div className="text-right space-y-0.5">
            <p>
              <span className="text-gray-500">Issue Date: </span>
              {formatDate(invoice.createdAt.toISOString())}
            </p>
            {invoice.dueDate && (
              <p>
                <span className="text-gray-500">Due Date: </span>
                {formatDate(invoice.dueDate.toISOString())}
              </p>
            )}
            <p>
              <span className="text-gray-500">Status: </span>
              <span className="font-semibold">{invoice.status}</span>
            </p>
            {invoice.job && <p><span className="text-gray-500">Job: </span>{invoice.job.title} ({invoice.job.jobNumber})</p>}
          </div>
        </section>

        {/* Items */}
        <table className="w-full text-sm mt-6 border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border border-gray-300 px-3 py-2">#</th>
              <th className="border border-gray-300 px-3 py-2">Item</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Qty</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Unit Price</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id}>
                <td className="border border-gray-300 px-3 py-2">{i + 1}</td>
                <td className="border border-gray-300 px-3 py-2">
                  <p className="font-medium">{it.name}</p>
                  {it.description && <p className="text-xs text-gray-500">{it.description}</p>}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">{it.quantity}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(Number(it.unitPrice), currency)}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(Number(it.totalPrice), currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mt-4">
          <div className="w-64 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatCurrency(Number(invoice.subtotal), currency)}</span>
            </div>
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span>- {formatCurrency(Number(invoice.discount), currency)}</span>
              </div>
            )}
            {Number(invoice.taxAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tax ({Number(invoice.taxRate)}%)</span>
                <span>{formatCurrency(Number(invoice.taxAmount), currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t-2 border-gray-800 pt-1">
              <span>Total</span>
              <span>{formatCurrency(Number(invoice.total), currency)}</span>
            </div>
            <div className="flex justify-between text-green-700">
              <span>Paid</span>
              <span>{formatCurrency(Number(invoice.amountPaid), currency)}</span>
            </div>
            <div className="flex justify-between font-semibold text-red-700">
              <span>Balance Due</span>
              <span>{formatCurrency(Number(invoice.balance), currency)}</span>
            </div>
          </div>
        </div>

        {/* Payments received */}
        {payments.length > 0 && (
          <section className="mt-8 text-sm">
            <p className="font-bold uppercase text-xs text-gray-500 mb-2">Payments Received</p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border border-gray-300 px-3 py-1.5">Reference</th>
                  <th className="border border-gray-300 px-3 py-1.5">Date</th>
                  <th className="border border-gray-300 px-3 py-1.5">Method</th>
                  <th className="border border-gray-300 px-3 py-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => (
                  <tr key={pay.id}>
                    <td className="border border-gray-300 px-3 py-1.5 font-mono text-xs">{pay.reference}</td>
                    <td className="border border-gray-300 px-3 py-1.5">{formatDate(pay.paymentDate.toISOString())}</td>
                    <td className="border border-gray-300 px-3 py-1.5">{String(pay.paymentMethod).replace(/_/g, " ")}</td>
                    <td className="border border-gray-300 px-3 py-1.5 text-right">{formatCurrency(Number(pay.amount), currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Notes + footer */}
        <footer className="mt-10 text-sm">
          {invoice.notes && (
            <div className="mb-4">
              <p className="font-bold uppercase text-xs text-gray-500 mb-1">Notes</p>
              <p className="whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
          <div className="border-t border-gray-300 pt-3 text-center text-xs text-gray-600">
            <p className="font-medium">{footer}</p>
            <p className="mt-1">
              {[business.name, business.phone, business.email].filter(Boolean).join(" · ")}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
