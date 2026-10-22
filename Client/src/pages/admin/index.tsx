import { useState } from "react";
import PageLayout from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Users, 
  ShieldCheck, 
  CreditCard, 
  Activity, 
  Search, 
  Bot, 
  Settings2, 
  CheckCircle2, 
  RefreshCw,
  Trash2,
  Crown,
  Building2
} from "lucide-react";

interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  mode: "PERSONAL" | "BUSINESS";
  plan: "FREE" | "PRO" | "BUSINESS";
  status: "TRIALING" | "ACTIVE" | "CANCELED";
  joinedDate: string;
  transactionCount: number;
}

export default function AdminPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<AdminUserRecord[]>([
    {
      id: "u1",
      name: "Vishakha Agrawal",
      email: "vishakha0508@taxgenie.com",
      mode: "BUSINESS",
      plan: "BUSINESS",
      status: "ACTIVE",
      joinedDate: "2026-09-01",
      transactionCount: 142,
    },
    {
      id: "u2",
      name: "Anuj Bansal",
      email: "anuj@taxgenie.com",
      mode: "PERSONAL",
      plan: "PRO",
      status: "ACTIVE",
      joinedDate: "2026-09-10",
      transactionCount: 89,
    },
    {
      id: "u3",
      name: "Sarah Jenkins",
      email: "sarah.j@acmecorp.com",
      mode: "PERSONAL",
      plan: "FREE",
      status: "TRIALING",
      joinedDate: "2026-09-24",
      transactionCount: 12,
    },
    {
      id: "u4",
      name: "David Miller",
      email: "david@freelance.io",
      mode: "BUSINESS",
      plan: "PRO",
      status: "ACTIVE",
      joinedDate: "2026-09-18",
      transactionCount: 56,
    },
  ]);

  const handlePlanChange = (userId: string, newPlan: "FREE" | "PRO" | "BUSINESS") => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, plan: newPlan, status: "ACTIVE" } : u))
    );
    toast.success(`User plan updated to ${newPlan}`);
  };

  const handleModeChange = (userId: string, newMode: "PERSONAL" | "BUSINESS") => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, mode: newMode } : u))
    );
    toast.success(`User mode updated to ${newMode}`);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success("User record deleted from database");
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout
      title="TaxGenie System Admin Control Panel"
      subtitle="Administrative oversight, platform system metrics, user records, and subscription overrides."
      addMarginTop
    >
      <div className="space-y-6">
        {/* System Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Total Platform Users</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active platform accounts</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Paid Subscriptions</span>
              <Crown className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-amber-500">
                {users.filter((u) => u.plan !== "FREE").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pro & Business subscribers</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Total Transactions</span>
              <Activity className="w-4 h-4 text-indigo-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-indigo-600">
                {users.reduce((acc, u) => acc + u.transactionCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Logged financial records</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted-foreground">AI Queries Served</span>
              <Bot className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-purple-600">1,248</div>
              <p className="text-xs text-muted-foreground mt-1">Gemini AI advisor requests</p>
            </CardContent>
          </Card>
        </div>

        {/* User Records Table */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                User Account Management
              </CardTitle>
              <CardDescription>Manage user roles, subscription overrides, and account settings</CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                    <th className="p-3">User</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Subscription Plan</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Joined Date</th>
                    <th className="p-3 text-center">Txns</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/10 transition">
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>

                      <td className="p-3">
                        <Select value={user.mode} onValueChange={(val: any) => handleModeChange(user.id, val)}>
                          <SelectTrigger className="h-8 text-xs w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERSONAL">Personal</SelectItem>
                            <SelectItem value="BUSINESS">Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="p-3">
                        <Select value={user.plan} onValueChange={(val: any) => handlePlanChange(user.id, val)}>
                          <SelectTrigger className="h-8 text-xs w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FREE">FREE</SelectItem>
                            <SelectItem value="PRO">PRO</SelectItem>
                            <SelectItem value="BUSINESS">BUSINESS</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="p-3">
                        <Badge variant="outline" className={user.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-amber-50 text-amber-700 border-amber-300"}>
                          {user.status}
                        </Badge>
                      </td>

                      <td className="p-3 text-muted-foreground text-xs">{user.joinedDate}</td>
                      <td className="p-3 text-center font-bold">{user.transactionCount}</td>

                      <td className="p-3 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
