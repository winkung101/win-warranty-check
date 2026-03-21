import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Info, AlertTriangle, X } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

const typeConfig: Record<string, { icon: typeof Info; bg: string; border: string; text: string }> = {
  info: { icon: Info, bg: "bg-primary/10", border: "border-primary/20", text: "text-primary" },
  warning: { icon: AlertTriangle, bg: "bg-warning/10", border: "border-warning/20", text: "text-warning" },
  urgent: { icon: AlertCircle, bg: "bg-destructive/10", border: "border-destructive/20", text: "text-destructive" },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setAnnouncements(data);
    };
    fetchAnnouncements();
  }, []);

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((a) => {
        const config = typeConfig[a.type] || typeConfig.info;
        const Icon = config.icon;
        return (
          <div
            key={a.id}
            className={`relative flex items-start gap-3 p-3 rounded-xl border ${config.bg} ${config.border} animate-fade-in`}
          >
            <Icon className={`shrink-0 mt-0.5 h-5 w-5 ${config.text}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${config.text}`}>{a.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
            </div>
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, a.id]))}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
