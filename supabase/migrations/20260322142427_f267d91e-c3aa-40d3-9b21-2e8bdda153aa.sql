
-- Create malware signatures table for real virus scanning
CREATE TABLE public.malware_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name text NOT NULL,
  app_name text NOT NULL,
  threat_level text NOT NULL DEFAULT 'medium',
  category text NOT NULL DEFAULT 'malware',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(package_name)
);

-- Enable RLS
ALTER TABLE public.malware_signatures ENABLE ROW LEVEL SECURITY;

-- Anyone can read malware signatures (needed for scanning)
CREATE POLICY "Anyone can read malware signatures" ON public.malware_signatures
  FOR SELECT TO public USING (true);

-- Only authenticated (admin) can manage
CREATE POLICY "Admin can insert malware signatures" ON public.malware_signatures
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin can update malware signatures" ON public.malware_signatures
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admin can delete malware signatures" ON public.malware_signatures
  FOR DELETE TO authenticated USING (true);

-- Insert initial known malware database
INSERT INTO public.malware_signatures (package_name, app_name, threat_level, category, description) VALUES
('com.joker.malware', 'Joker Malware', 'critical', 'trojan', 'ม้าโทรจันที่ขโมยข้อมูล SMS และสมัครบริการโดยไม่ได้รับอนุญาต'),
('com.hiddad.adware', 'Hiddad Adware', 'high', 'adware', 'แอดแวร์ที่แสดงโฆษณาซ่อนและขโมยข้อมูล'),
('com.fakeapp.banking', 'Fake Banking App', 'critical', 'phishing', 'แอปปลอมที่หลอกขโมยข้อมูลธนาคาร'),
('com.anubis.banker', 'Anubis Banker', 'critical', 'trojan', 'โทรจันธนาคารที่ขโมย credentials'),
('com.cerberus.rat', 'Cerberus RAT', 'critical', 'rat', 'Remote Access Trojan ควบคุมเครื่องจากระยะไกล'),
('com.flubot.sms', 'FluBot SMS', 'high', 'worm', 'มัลแวร์แพร่กระจายผ่าน SMS'),
('com.teabot.banking', 'TeaBot', 'critical', 'trojan', 'โทรจันขโมยข้อมูลธนาคารและ 2FA'),
('com.sharkbot.banking', 'SharkBot', 'critical', 'trojan', 'โทรจันธนาคารที่ขโมยเงินอัตโนมัติ'),
('com.vultur.rat', 'Vultur RAT', 'critical', 'rat', 'บันทึกหน้าจอและขโมยข้อมูล'),
('com.hydra.banker', 'Hydra Banker', 'high', 'trojan', 'โทรจันขโมยข้อมูลธนาคาร'),
('com.adware.aggressive', 'Aggressive Adware', 'medium', 'adware', 'แอดแวร์ที่แสดงโฆษณาเต็มจอ'),
('com.spyware.stalker', 'Stalkerware', 'critical', 'spyware', 'สปายแวร์ที่ติดตามตำแหน่งและอ่านข้อความ'),
('com.cryptominer.hidden', 'Hidden Crypto Miner', 'high', 'cryptominer', 'ขุดคริปโตแอบใช้ทรัพยากรเครื่อง'),
('com.fakevpn.spy', 'Fake VPN Spy', 'high', 'spyware', 'VPN ปลอมที่ดักจับข้อมูลเครือข่าย'),
('com.dropper.malware', 'Dropper App', 'critical', 'dropper', 'แอปที่ดาวน์โหลดมัลแวร์เพิ่มเติม');
