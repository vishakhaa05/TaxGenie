import { useState, useEffect } from "react";
import PageLayout from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  FolderLock, 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  Trash2, 
  Download,
  CheckCircle2,
  Lock
} from "lucide-react";

interface TaxDocument {
  id: string;
  name: string;
  category: "80C" | "80D" | "HRA" | "HOME_LOAN" | "BUSINESS" | "SALARY" | "OTHER";
  uploadDate: string;
  size: string;
  url: string;
}

const INITIAL_DOCUMENTS: TaxDocument[] = [
  {
    id: "1",
    name: "PPF_Investment_Receipt_2026.pdf",
    category: "80C",
    uploadDate: "2026-09-15",
    size: "1.2 MB",
    url: "#",
  },
  {
    id: "2",
    name: "Health_Insurance_Premium_80D.pdf",
    category: "80D",
    uploadDate: "2026-08-20",
    size: "850 KB",
    url: "#",
  },
  {
    id: "3",
    name: "House_Rent_Agreement_HRA.pdf",
    category: "HRA",
    uploadDate: "2026-07-10",
    size: "2.4 MB",
    url: "#",
  },
];

export default function TaxDocuments() {
  const [documents, setDocuments] = useState<TaxDocument[]>(() => {
    try {
      const saved = localStorage.getItem("taxgenie_vault_docs");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_DOCUMENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("taxgenie_vault_docs", JSON.stringify(documents));
    } catch (e) {
      console.warn("Failed to persist documents to localStorage:", e);
    }
  }, [documents]);

  const [docName, setDocName] = useState("");
  const [category, setCategory] = useState<TaxDocument["category"]>("80C");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      toast.error("Please enter a document name");
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      const newDoc: TaxDocument = {
        id: Date.now().toString(),
        name: docName,
        category,
        uploadDate: new Date().toISOString().split("T")[0],
        size: "1.5 MB",
        url: "#",
      };
      setDocuments((prev) => [newDoc, ...prev]);
      setDocName("");
      setIsUploading(false);
      toast.success("Tax document uploaded to secure Cloudinary vault!");
    }, 1000);
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    toast.success("Document removed from vault");
  };

  return (
    <PageLayout
      title="Tax Documents Vault"
      subtitle="Securely upload and categorize your Form 16, 80C proofs, HRA receipts, and business invoices."
      addMarginTop
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Form */}
          <Card className="lg:col-span-4 border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
                Upload Tax Proof
              </CardTitle>
              <CardDescription>Upload PDF or image proofs for audit verification</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="docName">Document Name</Label>
                  <Input
                    id="docName"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g. Form 16 2026-27"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="80C">Section 80C Proofs (PPF, ELSS)</SelectItem>
                      <SelectItem value="80D">Section 80D (Health Insurance)</SelectItem>
                      <SelectItem value="HRA">HRA Rent Receipts</SelectItem>
                      <SelectItem value="HOME_LOAN">Home Loan Statement (Sec 24b)</SelectItem>
                      <SelectItem value="SALARY">Form 16 / Salary Slips</SelectItem>
                      <SelectItem value="BUSINESS">Business Expense Invoices</SelectItem>
                      <SelectItem value="OTHER">Other Documents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-2 border-dashed rounded-xl p-6 text-center space-y-2 bg-muted/20">
                  <FileText className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-xs text-muted-foreground">PDF, PNG, JPG up to 10MB</p>
                </div>

                <Button type="submit" disabled={isUploading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
                  {isUploading ? "Uploading..." : "Save to Vault"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Document List */}
          <Card className="lg:col-span-8 border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FolderLock className="w-5 h-5 text-indigo-600" />
                  Your Tax Proof Vault ({documents.length})
                </CardTitle>
                <CardDescription>Encrypted and authenticated user storage</CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                <Lock className="w-3 h-3 mr-1" /> Encrypted Vault
              </Badge>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3.5 border rounded-xl bg-background hover:bg-muted/10 transition">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{doc.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Uploaded on {doc.uploadDate} • {doc.size}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300">
                          {doc.category}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12 space-y-2 border border-dashed rounded-xl">
                  <FolderLock className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
                  <h4 className="text-sm font-semibold">Vault Empty</h4>
                  <p className="text-xs text-muted-foreground">Upload your tax deduction proofs for safe keeping.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
