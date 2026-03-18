import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, ShieldCheck, Info } from "lucide-react";

const Index = () => {
  const [device, setDevice] = useState({ model: "กำลังตรวจสอบ...", os: "" });

  useEffect(() => {
    const ua = navigator.userAgent;
    let model = "ไม่ทราบรุ่น";
    let os = "Unknown OS";

    if (ua.indexOf("iPhone") > -1) {
      model = "iPhone";
      os = "iOS";
    } else if (ua.indexOf("Android") > -1) {
      model = "Android Device";
      os = "Android";
    }
    
    setDevice({ model, os });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <header className="text-center my-6">
        <h1 className="text-2xl font-bold text-slate-900">WIN TECHNOLOGY</h1>
        <p className="text-slate-500">ร้านซ่อมมือถือวินคุง</p>
      </header>

      <div className="max-w-md mx-auto space-y-4">
        <Card className="border-t-4 border-t-blue-500 shadow-lg">
          <CardHeader className="flex flex-row items-center space-x-2">
            <Smartphone className="text-blue-500" />
            <CardTitle className="text-lg">ข้อมูลเครื่องของคุณ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500">รุ่นอุปกรณ์</p>
                <p className="font-semibold text-lg">{device.model}</p>
              </div>
              <Badge variant="outline">{device.os}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500 shadow-lg">
          <CardHeader className="flex flex-row items-center space-x-2">
            <ShieldCheck className="text-green-500" />
            <CardTitle className="text-lg">สถานะประกัน</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-6">
            <div className="bg-green-100 text-green-700 rounded-full py-2 px-4 inline-block font-bold text-xl mb-2">
              ปกติ (Active)
            </div>
            <p className="text-slate-500 text-sm">หมดอายุวันที่: 20 ธันวาคม 2026</p>
          </CardContent>
        </Card>

        <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3 border border-blue-100">
          <Info className="text-blue-500 shrink-0 mt-1" size={18} />
          <p className="text-xs text-blue-700">
            หากข้อมูลไม่ถูกต้อง หรือต้องการแจ้งซ่อมเพิ่มเติม ติดต่อสอบถามได้ที่หน้าร้าน "วินคุง" ได้ทันทีครับ
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;