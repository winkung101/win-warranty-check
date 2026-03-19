import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users, Plus, LogOut, ShieldCheck, ShieldX, Pencil, Trash2, Search,
} from "lucide-react";
import {
  getCustomers, addCustomer, updateCustomer, deleteCustomer,
  getWarrantyStatus, isAdminLoggedIn, adminLogout, type Customer,
} from "@/lib/warranty-store";
import { toast } from "sonner";

const emptyForm = { name: "", phone: "", device_model: "", imei: "", warranty_start: "", warranty_end: "", notes: "" };

const deviceFieldLabel = (key: string): string => {
  const labels: Record<string, string> = {
    platform: "แพลตฟอร์ม",
    browser: "เบราว์เซอร์",
    browserVersion: "เวอร์ชันเบราว์เซอร์",
    os: "ระบบปฏิบัติการ",
    osVersion: "เวอร์ชัน OS",
    screenSize: "ขนาดหน้าจอ",
    viewportSize: "ขนาด Viewport",
    pixelRatio: "Pixel Ratio",
    colorDepth: "Color Depth",
    language: "ภาษา",
    languages: "ภาษาทั้งหมด",
    timezone: "เขตเวลา",
    cookiesEnabled: "คุกกี้",
    online: "ออนไลน์",
    touchSupport: "รองรับ Touch",
    maxTouchPoints: "Touch Points",
    hardwareConcurrency: "CPU Cores",
    deviceMemory: "หน่วยความจำ (GB)",
    connectionType: "ประเภทเครือข่าย",
    connectionSpeed: "ความเร็วเครือข่าย",
    vendor: "Vendor",
    doNotTrack: "Do Not Track",
    pdfSupport: "รองรับ PDF",
    orientation: "แนวหน้าจอ",
  };
  return labels[key] || key;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch {
      toast.error("โหลดข้อมูลไม่สำเร็จ");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const loggedIn = await isAdminLoggedIn();
      if (!loggedIn) {
        navigate("/admin");
        return;
      }
      await refresh();
      setLoading(false);
    };
    init();
  }, [navigate, refresh]);

  const handleSubmit = async () => {
    if (!form.name || !form.imei || !form.warranty_start || !form.warranty_end) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    try {
      if (editId) {
        await updateCustomer(editId, form);
        toast.success("อัปเดตข้อมูลแล้ว");
      } else {
        await addCustomer(form);
        toast.success("เพิ่มลูกค้าแล้ว");
      }
      setForm(emptyForm);
      setEditId(null);
      setFormOpen(false);
      await refresh();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleEdit = (c: Customer) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      phone: c.phone || "",
      device_model: c.device_model || "",
      imei: c.imei,
      warranty_start: c.warranty_start,
      warranty_end: c.warranty_end,
      notes: c.notes || "",
    });
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      toast.success("ลบข้อมูลแล้ว");
      await refresh();
    } catch {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    navigate("/admin");
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.imei.includes(search) ||
      (c.device_model || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = customers.filter((c) => getWarrantyStatus(c).status === "active").length;
  const expiredCount = customers.length - activeCount;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero px-4 pb-6 pt-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-primary-foreground">Admin Dashboard</h1>
            <p className="text-xs text-primary-foreground/70">WIN TECHNOLOGY</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="mr-1 h-4 w-4" /> ออกจากระบบ
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 -mt-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <Users className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{customers.length}</p>
              <p className="text-xs text-muted-foreground">ทั้งหมด</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-success/30">
            <CardContent className="p-4 text-center">
              <ShieldCheck className="mx-auto mb-1 h-5 w-5 text-success" />
              <p className="text-2xl font-bold text-success">{activeCount}</p>
              <p className="text-xs text-muted-foreground">ปกติ</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-destructive/30">
            <CardContent className="p-4 text-center">
              <ShieldX className="mx-auto mb-1 h-5 w-5 text-destructive" />
              <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
              <p className="text-xs text-muted-foreground">หมดอายุ</p>
            </CardContent>
          </Card>
        </div>

        {/* Search + Add */}
        <div className="flex gap-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ค้นหาชื่อ, IMEI, รุ่น..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { setEditId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0 gap-1">
                <Plus className="h-4 w-4" /> เพิ่ม
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{editId ? "แก้ไขข้อมูล" : "เพิ่มลูกค้าใหม่"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>ชื่อลูกค้า *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>เบอร์โทร</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>รุ่นเครื่อง</Label><Input value={form.device_model} onChange={(e) => setForm({ ...form, device_model: e.target.value })} /></div>
                <div><Label>IMEI / Serial *</Label><Input value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>เริ่มประกัน *</Label><Input type="date" value={form.warranty_start} onChange={(e) => setForm({ ...form, warranty_start: e.target.value })} /></div>
                  <div><Label>สิ้นสุดประกัน *</Label><Input type="date" value={form.warranty_end} onChange={(e) => setForm({ ...form, warranty_end: e.target.value })} /></div>
                </div>
                <div><Label>หมายเหตุ</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={handleSubmit} className="w-full">{editId ? "บันทึกการแก้ไข" : "เพิ่มลูกค้า"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Customer List */}
        <div className="space-y-3 pb-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          {filtered.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">ยังไม่มีข้อมูลลูกค้า</CardContent></Card>
          ) : (
            filtered.map((c) => {
              const w = getWarrantyStatus(c);
              return (
                <Card key={c.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{c.name}</p>
                          <Badge variant={w.status === "active" ? "default" : "destructive"} className={`shrink-0 text-xs ${w.status === "active" ? "bg-success hover:bg-success/90" : ""}`}>
                            {w.status === "active" ? `เหลือ ${w.daysLeft} วัน` : "หมดอายุ"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{c.device_model} • {c.imei}</p>
                        <p className="text-xs text-muted-foreground">{c.phone}</p>
                        {c.last_check_at && (
                          <div className="mt-2 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {c.last_check_os} · {c.last_check_browser}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {c.last_check_screen}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                เช็คล่าสุด {new Date(c.last_check_at).toLocaleDateString('th-TH')} {new Date(c.last_check_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {(c as any).last_check_details && (
                              <details className="text-[11px]">
                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                                  ดูข้อมูลเครื่องละเอียด
                                </summary>
                                <div className="mt-1.5 p-2 bg-muted/50 rounded-md space-y-0.5 text-muted-foreground">
                                  {Object.entries((c as any).last_check_details as Record<string, string>)
                                    .filter(([key]) => key !== 'userAgent')
                                    .map(([key, val]) => (
                                      <div key={key} className="flex justify-between gap-2">
                                        <span className="font-medium text-foreground/70 shrink-0">{deviceFieldLabel(key)}</span>
                                        <span className="text-right truncate">{val}</span>
                                      </div>
                                    ))}
                                  <div className="pt-1 border-t border-border mt-1">
                                    <span className="font-medium text-foreground/70">User Agent</span>
                                    <p className="break-all text-[10px] mt-0.5">{(c as any).last_check_details.userAgent}</p>
                                  </div>
                                </div>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>ยืนยันการลบ?</AlertDialogTitle>
                              <AlertDialogDescription>ลบข้อมูลของ {c.name} ออกจากระบบ</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(c.id)}>ลบ</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
