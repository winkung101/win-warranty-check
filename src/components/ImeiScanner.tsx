import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanned: (code: string) => void;
}

const REGION_ID = "imei-scanner-region";

const ImeiScanner = ({ open, onOpenChange, onScanned }: Props) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStarting(true);

    const start = async () => {
      try {
        // 1) Explicitly request camera permission first so the browser shows the prompt
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("เบราว์เซอร์ไม่รองรับการเข้าถึงกล้อง (ต้องใช้ HTTPS)");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        // Release the probe stream — html5-qrcode will open its own
        stream.getTracks().forEach((t) => t.stop());

        // 2) Start the scanner
        const scanner = new Html5Qrcode(REGION_ID, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 280, height: 120 } },
          (decoded) => {
            if (cancelled) return;
            const cleaned = decoded.replace(/\s+/g, "");
            onScanned(cleaned);
            toast.success(`สแกนสำเร็จ: ${cleaned}`);
            stop();
            onOpenChange(false);
          },
          () => {}
        );
        if (!cancelled) setStarting(false);
      } catch (e: any) {
        const name = e?.name || "";
        let msg = e?.message || "ไม่ทราบสาเหตุ";
        if (name === "NotAllowedError" || /denied|permission/i.test(msg)) {
          msg = "คุณปฏิเสธสิทธิ์กล้อง — กดไอคอนกล้อง/แม่กุญแจที่แถบ URL แล้วเปิดสิทธิ์กล้องสำหรับเว็บนี้ จากนั้นกดสแกนใหม่";
        } else if (name === "NotFoundError") {
          msg = "ไม่พบกล้องบนอุปกรณ์นี้";
        } else if (name === "NotReadableError") {
          msg = "กล้องถูกใช้งานโดยแอปอื่น กรุณาปิดแอปกล้องอื่นก่อน";
        } else if (location.protocol !== "https:" && location.hostname !== "localhost") {
          msg = "ต้องเปิดผ่าน HTTPS เท่านั้น (ใช้ลิงก์ Published / Preview ของ Lovable)";
        }
        toast.error(msg);
        onOpenChange(false);
      }
    };

    const stop = async () => {
      try {
        if (scannerRef.current?.isScanning) await scannerRef.current.stop();
        await scannerRef.current?.clear();
      } catch {}
      scannerRef.current = null;
    };

    start();
    return () => { cancelled = true; stop(); };
  }, [open, onOpenChange, onScanned]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> สแกน IMEI / Serial
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div id={REGION_ID} className="w-full overflow-hidden rounded-lg bg-black aspect-[4/3]" />
          <p className="text-xs text-muted-foreground text-center">
            {starting ? "กำลังเปิดกล้อง..." : "วางบาร์โค้ด IMEI ให้อยู่ในกรอบ"}
          </p>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            <X className="mr-1 h-4 w-4" /> ยกเลิก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImeiScanner;
