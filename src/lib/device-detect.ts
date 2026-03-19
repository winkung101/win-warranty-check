export interface DeviceInfo {
  userAgent: string;
  platform: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenSize: string;
  viewportSize: string;
  pixelRatio: string;
  colorDepth: string;
  language: string;
  languages: string;
  timezone: string;
  cookiesEnabled: string;
  online: string;
  touchSupport: string;
  maxTouchPoints: string;
  hardwareConcurrency: string;
  deviceMemory: string;
  connectionType: string;
  connectionSpeed: string;
  vendor: string;
  doNotTrack: string;
  pdfSupport: string;
  orientation: string;
}

export function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;

  // Browser detection
  let browser = "Unknown";
  let browserVersion = "";
  if (ua.includes("Edg/")) {
    browser = "Edge";
    browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("OPR/") || ua.includes("Opera")) {
    browser = "Opera";
    browserVersion = ua.match(/OPR\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("Chrome/")) {
    browser = "Chrome";
    browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
    browser = "Safari";
    browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("Firefox/")) {
    browser = "Firefox";
    browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || "";
  }

  // OS detection
  let os = "Unknown";
  let osVersion = "";
  if (ua.includes("Android")) {
    os = "Android";
    osVersion = ua.match(/Android\s([\d.]+)/)?.[1] || "";
  } else if (/iPhone|iPad|iPod/.test(ua)) {
    os = "iOS";
    osVersion = ua.match(/OS\s([\d_]+)/)?.[1]?.replace(/_/g, ".") || "";
  } else if (ua.includes("Windows")) {
    os = "Windows";
    osVersion = ua.match(/Windows NT\s([\d.]+)/)?.[1] || "";
    const winMap: Record<string, string> = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" };
    osVersion = winMap[osVersion] || osVersion;
  } else if (ua.includes("Mac OS X")) {
    os = "macOS";
    osVersion = ua.match(/Mac OS X\s([\d_.]+)/)?.[1]?.replace(/_/g, ".") || "";
  } else if (ua.includes("Linux")) {
    os = "Linux";
  } else if (ua.includes("CrOS")) {
    os = "ChromeOS";
  }

  // Connection info
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const connectionType = conn?.effectiveType || conn?.type || "unknown";
  const connectionSpeed = conn?.downlink ? `${conn.downlink} Mbps` : "unknown";

  // Orientation
  let orientation = "unknown";
  try {
    orientation = screen.orientation?.type || (window.innerWidth > window.innerHeight ? "landscape" : "portrait");
  } catch {
    orientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
  }

  return {
    userAgent: ua,
    platform: navigator.platform || "Unknown",
    browser,
    browserVersion,
    os,
    osVersion,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: String(window.devicePixelRatio || 1),
    colorDepth: `${window.screen.colorDepth}-bit`,
    language: navigator.language || "unknown",
    languages: (navigator.languages || []).join(", ") || "unknown",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
    cookiesEnabled: String(navigator.cookieEnabled),
    online: String(navigator.onLine),
    touchSupport: String("ontouchstart" in window || navigator.maxTouchPoints > 0),
    maxTouchPoints: String(navigator.maxTouchPoints || 0),
    hardwareConcurrency: String((navigator as any).hardwareConcurrency || "unknown"),
    deviceMemory: String((navigator as any).deviceMemory || "unknown"),
    connectionType,
    connectionSpeed,
    vendor: navigator.vendor || "unknown",
    doNotTrack: navigator.doNotTrack || "unspecified",
    pdfSupport: String(navigator.pdfViewerEnabled ?? "unknown"),
    orientation,
  };
}

/** Serialize full device info into a compact JSON string for DB storage */
export function serializeDeviceInfo(info: DeviceInfo): string {
  return JSON.stringify(info);
}
