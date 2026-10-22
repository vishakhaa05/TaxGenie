import { useState } from "react";
import Logo from "@/components/logo/logo";
import PageLayout from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  FileCheck, 
  Printer, 
  Plus, 
  Trash2, 
  Download, 
  Building2, 
  User, 
  Sparkles,
  Receipt,
  CheckCircle2
} from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  gstRate: number;
}

export default function InvoiceGenerator() {
  const [invoiceNumber, setInvoiceNumber] = useState(`TG-INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  
  // Business & Client details
  const [businessName, setBusinessName] = useState("TaxGenie Business Solutions");
  const [businessGstin, setBusinessGstin] = useState("07AAAAA0000A1Z5");
  const [clientName, setClientName] = useState("Acme Corp Pvt Ltd");
  const [clientEmail, setClientEmail] = useState("billing@acmecorp.com");
  const [clientGstin, setClientGstin] = useState("27BBBBB1111B1Z2");

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      description: "Financial Consulting & Tax Advisory Services",
      quantity: 1,
      rate: 25000,
      gstRate: 18,
    },
    {
      id: "2",
      description: "GST Filing & Audit Compliance",
      quantity: 1,
      rate: 10000,
      gstRate: 18,
    },
  ]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        description: "New Service / Item",
        quantity: 1,
        rate: 5000,
        gstRate: 18,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("Invoice must contain at least one line item");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
  const totalGst = items.reduce(
    (acc, item) => acc + (item.quantity * item.rate * item.gstRate) / 100,
    0
  );
  const grandTotal = subtotal + totalGst;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <PageLayout
      title="GST Invoice Generator"
      subtitle="Create, print, and export professional GST-compliant invoices for your clients."
      addMarginTop
      rightAction={
        <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer">
          <Printer className="w-4 h-4" /> Print / Export PDF
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        {/* Editor Controls (Hidden during print) */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Invoice Details & Parties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="invNum">Invoice #</Label>
                  <Input id="invNum" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="invDate">Invoice Date</Label>
                  <Input id="invDate" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="bName">Your Business Name</Label>
                <Input id="bName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bGstin">Your GSTIN</Label>
                <Input id="bGstin" value={businessGstin} onChange={(e) => setBusinessGstin(e.target.value)} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="cName">Client Company Name</Label>
                <Input id="cName" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cEmail">Client Email</Label>
                  <Input id="cEmail" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="cGstin">Client GSTIN</Label>
                  <Input id="cGstin" value={clientGstin} onChange={(e) => setClientGstin(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Invoice Preview & Printable Canvas */}
        <div className="lg:col-span-7">
          <Card className="border shadow-md bg-white text-black p-6 md:p-8 space-y-6 print:border-none print:shadow-none">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b pb-6">
              <div className="flex items-center gap-3">
                <Logo showText={false} size="md" asLink={false} />
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-900">{businessName}</h2>
                  <p className="text-xs text-gray-500">GSTIN: {businessGstin}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block">TAX INVOICE</span>
                <p className="text-base font-extrabold text-gray-900">{invoiceNumber}</p>
                <p className="text-xs text-gray-500">Date: {invoiceDate}</p>
                <p className="text-xs text-gray-500">Due: {dueDate}</p>
              </div>
            </div>

            {/* Client Info */}
            <div className="p-4 bg-gray-50 rounded-xl border flex justify-between items-start text-sm">
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase">Billed To:</span>
                <p className="font-bold text-gray-900 text-base">{clientName}</p>
                <p className="text-gray-600">{clientEmail}</p>
                <p className="text-gray-600 text-xs">GSTIN: {clientGstin}</p>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Payment Status: PENDING
              </Badge>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center print:hidden">
                <h4 className="font-semibold text-sm">Line Items</h4>
                <Button size="sm" variant="outline" onClick={handleAddItem} className="gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-100 text-gray-700 text-xs uppercase">
                      <th className="p-2">Description</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Rate (₹)</th>
                      <th className="p-2 text-center">GST %</th>
                      <th className="p-2 text-right">Amount (₹)</th>
                      <th className="p-2 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">
                          <Input
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                            className="h-8 border-none focus-visible:ring-1 print:bg-transparent"
                          />
                        </td>
                        <td className="p-2 text-center w-16">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, "quantity", Number(e.target.value))}
                            className="h-8 text-center border-none focus-visible:ring-1"
                          />
                        </td>
                        <td className="p-2 text-right w-24">
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleUpdateItem(item.id, "rate", Number(e.target.value))}
                            className="h-8 text-right border-none focus-visible:ring-1"
                          />
                        </td>
                        <td className="p-2 text-center w-16">
                          <Input
                            type="number"
                            value={item.gstRate}
                            onChange={(e) => handleUpdateItem(item.id, "gstRate", Number(e.target.value))}
                            className="h-8 text-center border-none focus-visible:ring-1"
                          />
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {formatCurrency(item.quantity * item.rate)}
                        </td>
                        <td className="p-2 text-center print:hidden">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleRemoveItem(item.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="flex justify-end pt-4 border-t">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total GST (18%):</span>
                  <span className="font-semibold">{formatCurrency(totalGst)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-extrabold text-gray-900 pt-1">
                  <span>Grand Total:</span>
                  <span className="text-emerald-600">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-6 text-center text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700">Thank you for your business!</p>
              <p>Invoice generated securely via TaxGenie AI Finance Operating System.</p>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
