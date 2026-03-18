import { useState, useMemo } from "react";
import { Smartphone, Monitor, Globe, Cpu, Search, ShieldCheck, ShieldX, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { detectDevice } from "@/lib/device-detect";
import { findCustomerByImei, getWarrantyStatus } from "@/lib/warranty-store";
import { Customer } from "@/types/warranty";
import winLogo from "@/assets/win-logo.png";
import { Link } from "react-router-dom";

const Index = () => {
  const device = useMemo(() => detectDevice(), []);
  const [imei, setImei] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [searched, setSearched] = useState(false);

  const warranty = customer ? getWarrantyStatus(customer) : null;

  const handleSearch = () => {
    const found = findCustomerByImei(imei.trim());
    setCustomer(found || null);
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="gradient-hero px-4 pb-8 pt-10 text-center">
        <div className="mx-auto max-w-md">
          <img src={winLogo} alt="WIN TECHNOLOGY" className="mx-auto mb-3 h-20 w-20 rounded-2xl bg-card/10 p-2 backdrop-blur-sm" />
          <h1 className="text-2xl font-extrabold text-primary-foreground">WIN TECHNOLOGY</h1>
          <p className="mt-1 text-sm text-primary-foreground/70">ร้านซ่อมมือถือวินคุง Service Center</p>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-4 px-4 -mt-4">
        {/* Device Info Card */}
        <Card className="shadow-card animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4 text-primary" />
              ข้อมูลอุปกรณ์ของคุณ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-3 rounded-lg bg-muted p-2.5">
              <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">ระบบปฏิบัติการ</p>
                <p className="font-medium">{device.os}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted p-2.5">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">เบราว์เซอร์</p>
                <p className="font-medium">{device.browser}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted p-2.5">
              <Cpu className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">หน้าจอ</p>
                <p className="font-medium">{device.screenSize}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warranty Search */}
        <Card className="shadow-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-primary" />
              เช็คสถานะประกัน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="กรอก IMEI / Serial Number"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} size="sm" className="shrink-0">
                ค้นหา
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warranty Result */}
        {searched && (
          <div className="animate-fade-in">
            {customer && warranty ? (
              <Card className={`shadow-elevated border-2 ${warranty.status === "active" ? "border-success" : "border-destructive"}`}>
                <CardContent className="pt-6 text-center">
                  {warranty.status === "active" ? (
                    <ShieldCheck className="mx-auto mb-3 h-16 w-16 text-success animate-pulse-glow rounded-full" />
                  ) : (
                    <ShieldX className="mx-auto mb-3 h-16 w-16 text-destructive" />
                  )}
                  <Badge variant={warranty.status === "active" ? "default" : "destructive"} className={`mb-3 text-sm px-4 py-1 ${warranty.status === "active" ? "bg-success hover:bg-success/90" : ""}`}>
                    {warranty.status === "active" ? "ประกันปกติ" : "ประกันหมดอายุ"}
                  </Badge>
                  <div className="space-y-2 text-sm mt-4">
                    <p><span className="text-muted-foreground">ชื่อลูกค้า:</span> <strong>{customer.name}</strong></p>
                    <p><span className="text-muted-foreground">รุ่นเครื่อง:</span> <strong>{customer.deviceModel}</strong></p>
                    <p><span className="text-muted-foreground">IMEI:</span> <strong>{customer.imei}</strong></p>
                    <div className="flex items-center justify-center gap-2 mt-3 rounded-lg bg-muted p-3">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {customer.warrantyStart} — {customer.warrantyEnd}
                      </span>
                    </div>
                    {warranty.status === "active" && (
                      <p className="text-success font-semibold mt-2">เหลืออีก {warranty.daysLeft} วัน</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-warning/50">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">ไม่พบข้อมูลประกัน กรุณาตรวจสอบ IMEI อีกครั้ง</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Admin Link */}
        <div className="text-center pb-8 pt-4">
          <Link to="/admin" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            สำหรับแอดมิน →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
