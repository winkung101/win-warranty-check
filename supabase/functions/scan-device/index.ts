import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { imei, installed_apps } = await req.json();

    if (!imei || !Array.isArray(installed_apps)) {
      return new Response(JSON.stringify({ error: "imei and installed_apps[] required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all malware signatures
    const { data: signatures } = await supabase
      .from("malware_signatures")
      .select("*");

    const malwareMap = new Map(
      (signatures || []).map((s: any) => [s.package_name.toLowerCase(), s])
    );

    // Check installed apps against malware database
    const threats: any[] = [];
    const scannedCount = installed_apps.length;

    for (const app of installed_apps) {
      const packageName = (app.packageName || app).toString().toLowerCase();
      const match = malwareMap.get(packageName);
      if (match) {
        threats.push({
          package_name: match.package_name,
          app_name: match.app_name,
          threat_level: match.threat_level,
          category: match.category,
          description: match.description,
        });
      }
    }

    const isSafe = threats.length === 0;
    const scanResult = isSafe ? "Safe" : "Threat Found";
    const details = isSafe
      ? `สแกน ${scannedCount} แอป ไม่พบภัยคุกคาม`
      : `พบ ${threats.length} ภัยคุกคามจาก ${scannedCount} แอป: ${threats.map(t => t.app_name).join(", ")}`;

    // Save scan result
    await supabase.from("virus_scans").insert({
      imei,
      scan_result: scanResult,
      details,
      scanned_by: "system",
    });

    return new Response(
      JSON.stringify({
        safe: isSafe,
        scan_result: scanResult,
        scanned_count: scannedCount,
        threats_found: threats.length,
        threats,
        details,
        signatures_count: signatures?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
