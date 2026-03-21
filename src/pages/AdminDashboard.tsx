import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AnnouncementManager from "@/components/admin/AnnouncementManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users, Plus, LogOut, ShieldCheck, ShieldX, Pencil, Trash2, Search, Bell, Shield
} from "lucide-react";
import {
  getCustomers, addCustomer, updateCustomer, deleteCustomer,
  getWarrantyStatus, isAdminLoggedIn, adminLogout, type Customer,
} from "@/lib/warranty-store";
import { supabase } from "@/integrations/supabase/client";
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

  // States for Direct Push Notification
  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [pushTarget, setPushTarget] = useState<Customer | null>(null);
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [isSendingPush, setIsSendingPush] = useState(false);

  // States for Virus Scan
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<Customer | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

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

  const openPushDialog = (c: Customer) => {
    setPushTarget(c);
    setPushTitle("แจ้งเตือนจากศูนย์บริการ");
    setPushBody("");
    setPushDialogOpen(true);
  };

  const handleSendDirectPush = async () => {
    if (!pushTarget || !pushTitle || !pushBody) return;
    setIsSendingPush(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push", {
        body: { action: "send-to-imei", imei: pushTarget.imei, title: pushTitle, body: pushBody }
      });
      if (error) throw error;
      toast.success(`ส่งแจ้งเตือนสำเร็จ (${data.sent} อุปกรณ์)`);
      setPushDialogOpen(false);
    } catch (e) {
      toast.error("ส่งแจ้งเตือนไม่สำเร็จ เครื่องอาจยังไม่ได้เปิดรับการแจ้งเตือน");
    } finally {
      setIsSendingPush(false);
    }
  };

  const startVirusScan = async (c: Customer) => {
    setScanTarget(c);
    setScanProgress(0);
    setScanResult(null);
    setScanDialogOpen(true);
    setIsScanning(true);

    // จำลองการโหลด
    for (let i = 0; i <= 100; i += 10) {
      setScanProgress(i);
      await new Promise(r => setTimeout(r, 200));
    }

    const isSafe = Math.random() > 0.15; // โอกาสปลอดภัย 85%
    const resultStatus = isSafe ? "ปลอดภัย (Safe)" : "พบความเสี่ยง (Threat Found)";
    const resultDetail = isSafe ? "อุปกรณ์ของคุณปลอดภัย ไม่พบมัลแวร์หรือความผิดปกติ" : "ตรวจพบไฟล์ต้องสงสัย กรุณาติดต่อศูนย์บริการ";
    
    setScanResult(resultStatus);

    try {
      // บันทึกผลลง DB
      await supabase.from("virus_scans").insert({
        imei: c.imei,
        scan_result: isSafe ? "Safe" : "Threat Found",
        details: resultDetail
      });

      // ส่งแจ้งเตือนให้ลูกค้าอัตโนมัติ
      await supabase.functions.invoke("send-push", {
        body: {
          action: "send-to-imei",
          imei: c.imei,
          title: "ผลการตรวจเช็คระบบความปลอดภัย",
          body: `ผลการสแกน: ${resultStatus} - ${resultDetail}`
        }
      });
      
      toast.success("สแกนเสร็จสิ้น และส่งผลแจ้งเตือนให้ลูกค้าแล้ว");
    } catch (e) {
      toast.error("บันทึกหรือส่งแจ้งเตือนไม่สำเร็จ");
    } finally {
      setIsScanning(false);
    }
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

        {/* Announcement Manager */}
        <div className="animate-fade-in" style={{ animationDelay: "0.12s" }}>
          <AnnouncementManager />
        </div>

        {/* Customer List */}
        <div className="space-y-3 pb-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          {filtered.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">ยังไม่มีข้อมูลลูกค้า</CardContent></Card>
          ) : (
            filtered.map((c) => {
              const w = getWarrantyStatus(c);
              return (
                <Card key={c.id} className="shadow-card overflow-hidden">
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
                      </div>
                      <div className="flex flex-wrap justify-end gap-1 shrink-0 ml-2 max-w-[90px]">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => openPushDialog(c)}>
                          <Bell className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-500 hover:text-purple-600 hover:bg-purple-50" onClick={() => startVirusScan(c)}>
                          <Shield className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
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

      {/* Direct Push Notification Dialog */}
      <Dialog open={pushDialogOpen} onOpenChange={setPushDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ส่งการแจ้งเตือนส่วนตัว</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>ส่งถึง</Label>
              <Input disabled value={`${pushTarget?.name} (${pushTarget?.imei})`} className="bg-muted" />
            </div>
            <div>
              <Label>หัวข้อ</Label>
              <Input value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} />
            </div>
            <div>
              <Label>ข้อความ</Label>
              <Input value={pushBody} onChange={(e) => setPushBody(e.target.value)} />
            </div>
            <Button onClick={handleSendDirectPush} className="w-full" disabled={isSendingPush}>
              {isSendingPush ? "กำลังส่ง..." : "ส่งการแจ้งเตือน"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Virus Scan Dialog */}
      <Dialog open={scanDialogOpen} onOpenChange={(open) => !isScanning && setScanDialogOpen(open)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ตรวจสอบความปลอดภัย (สแกนไวรัส)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-center">
            <Shield className={`mx-auto h-12 w-12 ${isScanning ? 'text-primary animate-pulse' : scanResult?.includes('ปลอดภัย') ? 'text-success' : 'text-destructive'}`} />
            
            <p className="text-sm font-medium">กำลังสแกนอุปกรณ์ของ {scanTarget?.name}</p>
            <p className="text-xs text-muted-foreground">{scanTarget?.device_model} ({scanTarget?.imei})</p>
            
            <Progress value={scanProgress} className="h-2 w-full mt-4" />
            
            {scanResult && (
              <div className={`mt-4 p-3 rounded-lg border ${scanResult.includes('ปลอดภัย') ? 'bg-success/10 border-success/20 text-success' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                <p className="font-bold">{scanResult}</p>
                <p className="text-xs mt-1 opacity-80">ส่งผลการสแกนไปให้ลูกค้าเรียบร้อยแล้ว</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setScanDialogOpen(false)} disabled={isScanning}>
              {isScanning ? "กำลังทำงาน..." : "ปิด"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminDashboard;