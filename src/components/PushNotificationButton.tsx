import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeToPush, isPushSubscribed, isPushSupported } from "@/lib/push-notifications";
import { toast } from "sonner";

interface Props {
  imei: string;
}

export default function PushNotificationButton({ imei }: Props) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    isPushSubscribed().then(setSubscribed);
  }, []);

  if (!isPushSupported()) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("กรุณาอนุญาตการแจ้งเตือนในเบราว์เซอร์");
        return;
      }
      const ok = await subscribeToPush(imei);
      if (ok) {
        setSubscribed(true);
        toast.success("เปิดการแจ้งเตือนแล้ว! จะได้รับแจ้งเมื่อประกันใกล้หมดอายุ");
      } else {
        toast.error("ไม่สามารถเปิดการแจ้งเตือนได้");
      }
    } catch (e) {
      console.error(e);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-success">
        <BellRing className="h-5 w-5" />
        <span className="text-sm font-medium">เปิดการแจ้งเตือนแล้ว</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleSubscribe}
      disabled={loading}
      variant="outline"
      className="w-full gap-2 h-11 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
    >
      <Bell className="h-4 w-4" />
      {loading ? "กำลังเปิด..." : "เปิดการแจ้งเตือนประกันใกล้หมด"}
    </Button>
  );
}
