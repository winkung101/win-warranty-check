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
        toast.error("ไม่สามารถเปิดกล้องได้: " + (e?.message || "permission denied"));
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
