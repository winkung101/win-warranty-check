// Real device scanner: collects artifacts accessible from the runtime
// (browser/PWA or Capacitor native shell) to compare against the
// malware_signatures database. No mock data.

export interface CollectedApp {
  packageName: string;
  appName: string;
  source: string;
}

export interface ScanCollection {
  apps: CollectedApp[];
  artifacts: {
    serviceWorkers: number;
    plugins: string[];
    storageKeys: number;
    indexedDbs: string[];
    cacheNames: string[];
  };
  native: boolean;
}

async function tryNativeAppList(): Promise<CollectedApp[]> {
  // Capacitor native plugins expose installed apps on Android.
  // We probe well-known plugin shapes; if none exist we return [].
  const w = window as any;
  const Capacitor = w.Capacitor;
  if (!Capacitor?.isNativePlatform?.()) return [];

  const probes = ["AppList", "InstalledApps", "AppListPlugin"];
  for (const name of probes) {
    const plugin = Capacitor.Plugins?.[name];
    if (!plugin) continue;
    try {
      const fn = plugin.getApps || plugin.getInstalledApps || plugin.list;
      if (typeof fn !== "function") continue;
      const res = await fn.call(plugin);
      const list: any[] = res?.apps || res?.installed || res || [];
      return list.map((a: any) => ({
        packageName: (a.packageName || a.id || a.bundleId || "").toString(),
        appName: (a.name || a.appName || a.label || a.packageName || "Unknown").toString(),
        source: `native:${name}`,
      })).filter(a => a.packageName);
    } catch {
      // try next
    }
  }
  return [];
}

async function collectServiceWorkers(): Promise<{ count: number; scripts: string[] }> {
  if (!("serviceWorker" in navigator)) return { count: 0, scripts: [] };
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    return {
      count: regs.length,
      scripts: regs.map(r => r.active?.scriptURL || r.installing?.scriptURL || "").filter(Boolean),
    };
  } catch {
    return { count: 0, scripts: [] };
  }
}

async function collectIndexedDbs(): Promise<string[]> {
  const idb = (indexedDB as any);
  if (typeof idb.databases !== "function") return [];
  try {
    const dbs = await idb.databases();
    return dbs.map((d: any) => d.name).filter(Boolean);
  } catch { return []; }
}

async function collectCacheNames(): Promise<string[]> {
  if (!("caches" in window)) return [];
  try { return await caches.keys(); } catch { return []; }
}

export async function collectDeviceScan(): Promise<ScanCollection> {
  const [nativeApps, sw, idbs, cacheNames] = await Promise.all([
    tryNativeAppList(),
    collectServiceWorkers(),
    collectIndexedDbs(),
    collectCacheNames(),
  ]);

  const plugins: string[] = [];
  try {
    for (let i = 0; i < (navigator.plugins?.length || 0); i++) {
      const p = navigator.plugins[i];
      plugins.push(p.name);
    }
  } catch {}

  // Treat browser-side artifacts as "apps" too so the malware DB can flag them.
  const webArtifactApps: CollectedApp[] = [
    ...sw.scripts.map(s => ({ packageName: s, appName: `ServiceWorker: ${s}`, source: "web:sw" })),
    ...idbs.map(n => ({ packageName: `idb:${n}`, appName: `IndexedDB: ${n}`, source: "web:idb" })),
    ...cacheNames.map(n => ({ packageName: `cache:${n}`, appName: `Cache: ${n}`, source: "web:cache" })),
    ...plugins.map(n => ({ packageName: `plugin:${n}`, appName: `BrowserPlugin: ${n}`, source: "web:plugin" })),
  ];

  return {
    apps: [...nativeApps, ...webArtifactApps],
    artifacts: {
      serviceWorkers: sw.count,
      plugins,
      storageKeys: localStorage.length,
      indexedDbs: idbs,
      cacheNames,
    },
    native: nativeApps.length > 0,
  };
}
