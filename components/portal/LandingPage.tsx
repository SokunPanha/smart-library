"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

type Platform = "android" | "ios" | "desktop" | "unknown";
type InstallState = "idle" | "prompted" | "installed";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  // Broad mobile check — catches other mobile browsers
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

export default function LandingPage() {
  const t = useTranslations("portal.landing");
  const locale = useLocale();

  const [platform, setPlatform] = useState<Platform>("unknown");
  const [installState, setInstallState] = useState<InstallState>("idle");
  const [iosStep, setIosStep] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deferredPrompt = useRef<any>(null);

  useEffect(() => {
    // If already installed (standalone), go straight to login
    if (isStandalone()) {
      window.location.replace(`/${locale}/login`);
      return;
    }

    setPlatform(detectPlatform());

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstallState("installed"));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [locale]);

  async function handleInstall() {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    if (outcome === "accepted") setInstallState("prompted");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex flex-col items-center justify-between px-6 py-12 text-white">

      {/* Top branding */}
      <div className="flex flex-col items-center gap-3 mt-8">
        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-lg">
          <img src="/LibraCore.png" alt="LibraCore" className="w-13 h-13 object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">LibraCore</h1>
          <p className="text-blue-200 text-sm mt-1">{t("subtitle")}</p>
        </div>
      </div>

      {/* Feature pills */}
      <div className="w-full max-w-xs space-y-3 my-10">
        {(["feature1", "feature2", "feature3", "feature4"] as const).map((k) => (
          <div key={k} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
            <span className="text-xl">{t(`${k}Icon`)}</span>
            <span className="text-sm text-blue-50">{t(k)}</span>
          </div>
        ))}
      </div>

      {/* Install CTA — platform-aware */}
      <div className="w-full max-w-xs space-y-3">

        {/* Already installed */}
        {installState === "installed" && (
          <div className="text-center bg-green-500/20 rounded-xl px-4 py-3">
            <p className="text-sm font-medium">✓ {t("installedMsg")}</p>
          </div>
        )}

        {/* Android — native prompt */}
        {platform === "android" && installState !== "installed" && (
          <button
            onClick={handleInstall}
            className="w-full bg-white text-blue-700 font-semibold text-base py-3.5 rounded-2xl shadow-lg active:opacity-80 transition-opacity"
          >
            {t("installBtn")}
          </button>
        )}

        {/* iOS — manual instructions */}
        {platform === "ios" && installState !== "installed" && (
          <div className="space-y-2">
            <button
              onClick={() => setIosStep(true)}
              className="w-full bg-white text-blue-700 font-semibold text-base py-3.5 rounded-2xl shadow-lg active:opacity-80 transition-opacity"
            >
              {t("installBtn")}
            </button>
            {iosStep && (
              <div className="bg-white/15 rounded-2xl px-4 py-4 space-y-2 text-sm text-blue-50">
                <p className="font-semibold text-white">{t("iosTitle")}</p>
                <p>1. {t("iosStep1")} <span className="text-white font-bold">⬆</span></p>
                <p>2. {t("iosStep2")}</p>
                <p>3. {t("iosStep3")}</p>
              </div>
            )}
          </div>
        )}

        {/* Desktop — tell them to use mobile */}
        {platform === "desktop" && (
          <div className="bg-white/10 rounded-2xl px-4 py-4 text-center space-y-1">
            <p className="text-2xl">📱</p>
            <p className="text-sm text-blue-100">{t("desktopHint")}</p>
          </div>
        )}

        {/* Always: web login link */}
        <Link
          href={`/${locale}/login`}
          className="block w-full text-center text-sm text-blue-200 py-3 hover:text-white transition-colors"
        >
          {t("continueWeb")} →
        </Link>
      </div>
    </div>
  );
}
