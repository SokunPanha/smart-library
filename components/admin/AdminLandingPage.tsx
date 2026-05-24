"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";

type Platform = "android" | "ios" | "desktop" | "unknown";
type InstallState = "idle" | "prompted" | "installed";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/Mobi|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

const FEATURES = [
  { icon: "📊", label: "Dashboard & reports" },
  { icon: "📚", label: "Catalog management" },
  { icon: "👥", label: "Member management" },
  { icon: "🔄", label: "Loans & circulation" },
];

export default function AdminLandingPage() {
  const locale = useLocale();

  const [platform, setPlatform] = useState<Platform>("unknown");
  const [installState, setInstallState] = useState<InstallState>("idle");
  const [iosStep, setIosStep] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deferredPrompt = useRef<any>(null);

  // Standalone check + platform detection (one-time on mount)
  useEffect(() => {
    if (isStandalone()) {
      window.location.replace(`/${locale}/admin/login`);
      return;
    }
    setPlatform(detectPlatform()); // eslint-disable-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PWA install prompt listeners
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
    };
    const installed = () => setInstallState("installed");

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    if (outcome === "accepted") setInstallState("prompted");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-800 via-slate-700 to-slate-900 flex flex-col items-center justify-between px-6 py-12 text-white">

      {/* Branding */}
      <div className="flex flex-col items-center gap-3 mt-6">
        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/LibraCore.png" alt="LibraCore" className="w-14 h-14 object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">LibraCore</h1>
          <p className="text-slate-400 text-sm mt-1">Admin Dashboard</p>
          <span className="inline-block mt-2 text-xs bg-slate-600 text-slate-300 px-2.5 py-0.5 rounded-full tracking-wide uppercase">
            Staff only
          </span>
        </div>
      </div>

      {/* Feature pills */}
      <div className="w-full max-w-xs space-y-3 my-10">
        {FEATURES.map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 border border-white/10">
            <span className="text-xl">{icon}</span>
            <span className="text-sm text-slate-200">{label}</span>
          </div>
        ))}
      </div>

      {/* Install CTA */}
      <div className="w-full max-w-xs space-y-3">

        {installState === "installed" && (
          <div className="text-center bg-green-500/20 border border-green-500/30 rounded-xl px-4 py-3">
            <p className="text-sm font-medium">✓ App installed! Open it from your home screen.</p>
          </div>
        )}

        {/* Android / Desktop Chrome — native prompt */}
        {(platform === "android" || platform === "desktop") && installState !== "installed" && (
          <button
            onClick={handleInstall}
            className="w-full bg-white text-slate-800 font-semibold text-base py-3.5 rounded-2xl shadow-lg active:opacity-80 hover:bg-slate-100 transition-colors"
          >
            Install App
          </button>
        )}

        {/* iOS — manual instructions */}
        {platform === "ios" && installState !== "installed" && (
          <div className="space-y-2">
            <button
              onClick={() => setIosStep(true)}
              className="w-full bg-white text-slate-800 font-semibold text-base py-3.5 rounded-2xl shadow-lg active:opacity-80 transition-opacity"
            >
              Install App
            </button>
            {iosStep && (
              <div className="bg-white/10 rounded-2xl px-4 py-4 space-y-2 text-sm text-slate-300 border border-white/15">
                <p className="font-semibold text-white">How to install on iPhone / iPad:</p>
                <p>1. Tap the Share button at the bottom <span className="text-white font-bold">⬆</span></p>
                <p>2. Scroll down and tap &quot;Add to Home Screen&quot;</p>
                <p>3. Tap &quot;Add&quot; to confirm</p>
              </div>
            )}
          </div>
        )}

        <Link
          href={`/${locale}/admin/login`}
          className="block w-full text-center text-sm text-slate-400 py-3 hover:text-white transition-colors"
        >
          Continue to login →
        </Link>
      </div>
    </div>
  );
}
