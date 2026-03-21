import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Megaphone, Plus, Trash2, Eye, EyeOff, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  created_at: string;
}

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [sendPush, setSendPush] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async () => {
    if (!title || !message) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    const { error } = await supabase.from("announcements").insert({ title, message, type });
    if (error) {
      toast.error("สร้างประกาศไม่สำเร็จ");
      return;
    }

    // Send push notification if checked
    if (sendPush) {
      try {
        await supabase.functions.invoke("send-push", {
          body: { action: "send-announcement", title, body: message },
        });
        toast.success("สร้างประกาศและส่ง Push แล้ว!");
      } catch {
        toast.success("สร้างประกาศแล้ว (Push ส่งไม่สำเร็จ)");
      }
    } else {
      toast.success("สร้างประกาศแล้ว");
    }

    setTitle("");
    setMessage("");
    setType("info");
    setSendPush(false);
    setFormOpen(false);
    await refresh();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from("announcements").update({ is_active: !isActive }).eq("id", id);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    toast.success("ลบประกาศแล้ว");
    await refresh();
  };

  const sendWarrantyNotifications = async () => {
    try {
      const { data } = await supabase.functions.invoke("send-push", {
        body: { action: "warranty-expiring" },
      });
      toast.success(`ส่งแจ้งเตือนแล้ว ${data?.sent || 0}/${data?.total || 0} คน`);
    } catch {
      toast.error("ส่งแจ้งเตือนไม่สำเร็จ");
    }
  };

  const typeBadge = (t: string) => {
    if (t === "urgent") return <Badge variant="destructive" className="text-[10px]">ด่วน</Badge>;
    if (t === "warning") return <Badge className="bg-warning text-warning-foreground text-[10px]">แจ้งเตือน</Badge>;
    return <Badge variant="secondary" className="text-[10px]">ข่าวสาร</Badge>;
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> ประกาศ & แจ้งเตือน
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={sendWarrantyNotifications} className="gap-1 text-xs">
              <Send className="h-3.5 w-3.5" /> แจ้งประกันใกล้หมด
            </Button>
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> สร้างประกาศ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>สร้างประกาศใหม่</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>หัวข้อ *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="หัวข้อประกาศ" />
                  </div>
                  <div>
                    <Label>ข้อความ *</Label>
                    <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="รายละเอียดประกาศ" rows={3} />
                  </div>
                  <div>
                    <Label>ประเภท</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">ข่าวสาร</SelectItem>
                        <SelectItem value="warning">แจ้งเตือน</SelectItem>
                        <SelectItem value="urgent">ด่วน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={sendPush} onChange={(e) => setSendPush(e.target.checked)} className="rounded" />
                    <Send className="h-3.5 w-3.5" /> ส่ง Push Notification ด้วย
                  </label>
                  <Button onClick={handleCreate} className="w-full">สร้างประกาศ</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีประกาศ</p>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border ${a.is_active ? "bg-card" : "bg-muted/50 opacity-60"}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{a.title}</span>
                  {typeBadge(a.type)}
                  {!a.is_active && <Badge variant="outline" className="text-[10px]">ปิด</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(a.created_at).toLocaleDateString("th-TH")}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(a.id, a.is_active)}>
                  {a.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>ลบประกาศ?</AlertDialogTitle>
                      <AlertDialogDescription>ลบประกาศ "{a.title}"</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(a.id)}>ลบ</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
