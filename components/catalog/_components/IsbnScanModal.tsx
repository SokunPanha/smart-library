"use client";

import { useEffect, useRef, useState } from "react";
import { Modal, Button, Spin, Alert } from "antd";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { BarcodeOutlined, ReloadOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/request";

const SCANNER_EL_ID = "isbn-barcode-reader";

export interface IsbnBookData {
  isbn: string;
  titleEn?: string | null;
  author?: string | null;
  publisher?: string | null;
  publishYear?: number | null;
  coverImage?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onScanned: (data: IsbnBookData) => void;
}

type ScanState = "scanning" | "loading" | "found" | "not_found" | "error";

export function IsbnScanModal({ open, onClose, onScanned }: Props) {
  const t = useTranslations("catalog");
  const [state, setState] = useState<ScanState>("scanning");
  const [found, setFound] = useState<IsbnBookData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockRef = useRef(false);

  async function stopScanner() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* already stopped */ }
      try { scannerRef.current.clear(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
  }

  async function startScanner() {
    const el = document.getElementById(SCANNER_EL_ID);
    if (!el || scannerRef.current) return;

    const scanner = new Html5Qrcode(SCANNER_EL_ID, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.CODE_128,
      ],
      verbose: false,
    });
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 100 } },
        async (decoded) => {
          if (lockRef.current) return;
          lockRef.current = true;
          setState("loading");
          try {
            const data = await apiFetch<IsbnBookData | null>(`/api/isbn/${encodeURIComponent(decoded)}`);
            await stopScanner();
            if (data) {
              setFound(data);
              setState("found");
            } else {
              setFound({ isbn: decoded });
              setState("not_found");
            }
          } catch {
            await stopScanner();
            setErrorMsg(t("isbnScan.error"));
            setState("error");
          }
        },
        undefined
      );
    } catch {
      setErrorMsg(t("isbnScan.cameraUnavailable"));
      setState("error");
      scannerRef.current = null;
    }
  }

  async function handleScanAgain() {
    await stopScanner();
    lockRef.current = false;
    setFound(null);
    setErrorMsg(null);
    setState("scanning");
    setTimeout(startScanner, 300);
  }

  useEffect(() => {
    if (!open) {
      stopScanner();
      lockRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFound(null);
      setErrorMsg(null);
      setState("scanning");
      return;
    }
    const timer = setTimeout(startScanner, 400);
    return () => { clearTimeout(timer); stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleUse() {
    if (found) {
      onScanned(found);
      onClose();
    }
  }

  const showCamera = state === "scanning" || state === "loading";

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <BarcodeOutlined />
          {t("isbnScan.title")}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      centered
      destroyOnHidden
    >
      {/* Camera — always in DOM so the element exists for html5-qrcode */}
      <div className={showCamera ? "block" : "hidden"}>
        <div className="relative rounded-lg overflow-hidden bg-black min-h-[220px]">
          <div id={SCANNER_EL_ID} className="w-full" />
          {state === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
              <Spin size="large" />
              <p className="text-white text-sm">{t("isbnScan.lookingUp")}</p>
            </div>
          )}
        </div>
        <p className="text-xs text-center text-slate-400 mt-2">{t("isbnScan.hint")}</p>
      </div>

      {/* Error */}
      {state === "error" && (
        <div className="space-y-3">
          <Alert type="error" message={errorMsg} showIcon />
          <Button icon={<ReloadOutlined />} block onClick={handleScanAgain}>
            {t("isbnScan.scanAgain")}
          </Button>
        </div>
      )}

      {/* Not found — show ISBN-only option */}
      {state === "not_found" && found && (
        <div className="space-y-3">
          <Alert
            type="warning"
            message={t("isbnScan.notFound")}
            description={`ISBN: ${found.isbn}`}
            showIcon
          />
          <div className="flex gap-2">
            <Button icon={<ReloadOutlined />} onClick={handleScanAgain} className="flex-1">
              {t("isbnScan.scanAgain")}
            </Button>
            <Button type="primary" onClick={handleUse} className="flex-1">
              {t("isbnScan.useIsbnOnly")}
            </Button>
          </div>
        </div>
      )}

      {/* Found */}
      {state === "found" && found && (
        <div className="space-y-4">
          <div className="flex gap-3 p-3 border border-green-200 bg-green-50 rounded-lg">
            {found.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={found.coverImage}
                alt="cover"
                className="w-14 h-20 object-cover rounded flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-20 rounded bg-slate-200 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm font-semibold text-slate-800 line-clamp-2">{found.titleEn}</p>
              {found.author && <p className="text-xs text-slate-500">{found.author}</p>}
              {found.publisher && <p className="text-xs text-slate-400">{found.publisher}</p>}
              {found.publishYear && <p className="text-xs text-slate-400">{found.publishYear}</p>}
              <p className="text-xs font-mono text-slate-400">{found.isbn}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={<ReloadOutlined />} onClick={handleScanAgain} className="flex-1">
              {t("isbnScan.scanAgain")}
            </Button>
            <Button type="primary" onClick={handleUse} className="flex-1">
              {t("isbnScan.use")}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
