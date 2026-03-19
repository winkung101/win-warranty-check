import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Smartphone, ShieldCheck, Search, AlertCircle, CheckCircle2, XCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getSavedImei, saveImei, clearSavedImei } from "@/lib/warranty-store";
import { detectDevice } from "@/lib/device-detect";
// force rebuild
const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const deviceInfo = detectDevice();

  // โหลด IMEI ที่เคยบันทึกไว้อัตโนมัติ
  useEffect(() => {
    const saved = getSavedImei();
    if (saved) {
      setSearchQuery(saved);
      searchByImei(saved);
    }
  }, []);

  const searchByImei = async (imei: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('imei', imei)
        .maybeSingle();

      if (error) throw error;
      setCustomer(data);

      if (data) {
        saveImei(imei);
        toast.success("ดึงข้อมูลสำเร็จ");
      } else {
        toast.error("ไม่พบข้อมูลประกันของคุณ");
      }
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    await searchByImei(searchQuery.trim());
  };

  const handleClear = () => {
    clearSavedImei();
    setSearchQuery("");
    setCustomer(null);
    setHasSearched(false);
  };

  const getWarrantyStatus = (warrantyEnd: string) => {
    const now = new Date();
    const end = new Date(warrantyEnd);
    const diffMs = end.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { expired: daysLeft <= 0, daysLeft: Math.max(0, daysLeft) };
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 font-sans">
      <header className="text-center my-8">
        <div className="inline-block p-3 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
          <ShieldCheck className="text-white" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">WIN TECHNOLOGY</h1>
        <p className="text-slate-500 font-medium">ระบบเช็คประกัน ร้านซ่อมมือถือวินคุง</p>
      </header>

      <div className="max-w-md mx-auto space-y-5">
        {/* Device Info */}
        <Card className="border-none shadow-sm rounded-2xl bg-white/80">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Smartphone size={14} />
              <span>อุปกรณ์ของคุณ</span>
            </div>
            <p className="text-sm text-slate-600">{deviceInfo.os} · {deviceInfo.browser}</p>
          </CardContent>
        </Card>

        {/* ค้นหาด้วย IMEI */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="กรอก IMEI / Serial Number"
              className="pl-10 h-12 bg-white border-slate-200 shadow-sm rounded-xl focus:ring-blue-500 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            )}
          </div>
          <Button type="submit" className="h-12 px-6 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all">
            ค้นหา
          </Button>
        </form>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : customer ? (
          <>
            {/* ข้อมูลลูกค้า */}
            <Card className="border-none shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Smartphone size={20} /> ข้อมูลเครื่อง
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-3">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">ชื่อลูกค้า</span>
                  <span className="font-bold text-slate-800">{customer.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">เบอร์โทรศัพท์</span>
                  <span className="font-medium text-slate-800">{customer.phone || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">รุ่นเครื่อง</span>
                  <span className="font-medium text-slate-800">{customer.device_model || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">IMEI/Serial</span>
                  <span className="font-mono text-sm text-slate-600">{customer.imei}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">เริ่มประกัน</span>
                  <span className="text-slate-700">{new Date(customer.warranty_start).toLocaleDateString('th-TH')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 text-sm">สิ้นสุดประกัน</span>
                  <span className="text-slate-700">{new Date(customer.warranty_end).toLocaleDateString('th-TH')}</span>
                </div>
                {customer.notes && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500 text-sm">หมายเหตุ: </span>
                    <span className="text-slate-600 text-sm">{customer.notes}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* สถานะประกัน */}
            {(() => {
              const { expired, daysLeft } = getWarrantyStatus(customer.warranty_end);
              return (
                <Card className={`border-none shadow-lg rounded-2xl overflow-hidden ${expired ? 'bg-red-50' : 'bg-green-50'}`}>
                  <CardContent className="pt-8 pb-8 text-center">
                    {expired ? (
                      <div className="space-y-3">
                        <XCircle className="mx-auto text-red-500" size={48} />
                        <h2 className="text-2xl font-black text-red-600 uppercase">ประกันหมดอายุ</h2>
                        <p className="text-red-400 text-sm font-medium">
                          สิ้นสุดเมื่อ: {new Date(customer.warranty_end).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <CheckCircle2 className="mx-auto text-green-500" size={48} />
                        <h2 className="text-2xl font-black text-green-600 uppercase">อยู่ในระยะประกัน</h2>
                        <p className="text-green-600/70 text-sm font-medium">
                          เหลืออีก {daysLeft} วัน (หมดอายุ {new Date(customer.warranty_end).toLocaleDateString('th-TH')})
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </>
        ) : hasSearched && (
          <div className="text-center py-10 text-slate-400 space-y-2">
            <Search size={48} className="mx-auto opacity-20" />
            <p>ไม่พบข้อมูล ลองตรวจสอบ IMEI อีกครั้งครับ</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
