import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Smartphone, ShieldCheck, Search, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ฟังก์ชันค้นหาข้อมูลจากตาราง customers
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    
    try {
      // ค้นหาจากเบอร์โทรศัพท์ หรือ ชื่อ (ปรับตามคอลัมน์ที่คุณมี)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`phone.eq.${searchQuery},name.ilike.%${searchQuery}%`)
        .maybeSingle();

      if (error) throw error;
      setCustomer(data);
      
      if (!data) {
        toast.error("ไม่พบข้อมูลประกันของคุณ");
      } else {
        toast.success("ดึงข้อมูลสำเร็จ");
      }
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  // ตรวจสอบวันหมดอายุ
  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
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
        {/* ส่วนการค้นหา */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="กรอกเบอร์โทร หรือ ชื่อลูกค้า" 
              className="pl-10 h-12 bg-white border-slate-200 shadow-sm rounded-xl focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
            {/* ข้อมูลเครื่อง/ลูกค้า */}
            <Card className="border-none shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Smartphone size={20} /> ข้อมูลเครื่อง
                  </CardTitle>
                  <Badge className="bg-blue-500/20 text-blue-300 border-none">
                    {customer.rank || "ลูกค้าทั่วไป"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-3">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 text-sm">ชื่อลูกค้า</span>
                  <span className="font-bold text-slate-800">{customer.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 text-sm">เบอร์โทรศัพท์</span>
                  <span className="font-medium text-slate-800">{customer.phone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 text-sm">ที่อยู่/ข้อมูลเสริม</span>
                  <span className="text-slate-600 text-right text-sm">{customer.address || "-"}</span>
                </div>
              </CardContent>
            </Card>

            {/* สถานะประกัน (สมมติว่าคุณมีคอลัมน์ created_at และบวกไป 90 วัน หรือมีคอลัมน์ expiry_date) */}
            <Card className={`border-none shadow-lg rounded-2xl overflow-hidden ${
              customer.expiry_date && isExpired(customer.expiry_date) ? 'bg-red-50' : 'bg-green-50'
            }`}>
              <CardContent className="pt-8 pb-8 text-center">
                {customer.expiry_date ? (
                  <>
                    {isExpired(customer.expiry_date) ? (
                      <div className="space-y-3">
                        <XCircle className="mx-auto text-red-500" size={48} />
                        <h2 className="text-2xl font-black text-red-600 uppercase">ประกันหมดอายุ</h2>
                        <p className="text-red-400 text-sm font-medium">
                          สิ้นสุดเมื่อ: {new Date(customer.expiry_date).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <CheckCircle2 className="mx-auto text-green-500" size={48} />
                        <h2 className="text-2xl font-black text-green-600 uppercase">อยู่ในระยะประกัน</h2>
                        <p className="text-green-600/70 text-sm font-medium">
                          หมดอายุวันที่: {new Date(customer.expiry_date).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2 text-slate-400 py-4">
                    <AlertCircle className="mx-auto" size={40} />
                    <p>ยังไม่ได้ลงข้อมูลวันที่หมดประกัน</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : hasSearched && (
          <div className="text-center py-10 text-slate-400 space-y-2">
            <Search size={48} className="mx-auto opacity-20" />
            <p>ไม่พบข้อมูล ลองตรวจสอบเบอร์โทรอีกครั้งครับ</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;