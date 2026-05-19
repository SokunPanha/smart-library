"use client";

import { useCallback, useRef, useState } from "react";
import { Modal, Button, Input } from "antd";
import { Html5Qrcode } from "html5-qrcode";
import { ReloadOutlined } from "@ant-design/icons";

interface Props {
  title: string;
  onScan: (value: string) => void;
  onClose: () => void;
}

export function QrScanner({ title, onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScanned = useRef(false);
  const [cameraError, setCameraError] = useState(false);
  const [manualValue, setManualValue] = useState("");

  // Called by React when the div enters the DOM (or null when it leaves)
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      stopScanner();
      return;
    }
    startScanner(el);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startScanner(el: HTMLDivElement) {
    const scanner = new Html5Qrcode(el.id);
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          if (hasScanned.current) return; // ignore duplicate frames
          hasScanned.current = true;
          stopScanner();
          onClose();
          onScan(text.trim());
        },
        () => {}
      )
      .catch(() => setCameraError(true));
  }

  function stopScanner() {
    const s = scannerRef.current;
    if (s?.isScanning) s.stop().catch(() => {});
    scannerRef.current = null;
  }

  function restart(el: HTMLDivElement | null) {
    if (!el) return;
    setCameraError(false);
    startScanner(el);
  }

  function handleManual() {
    const val = manualValue.trim();
    if (!val) return;
    stopScanner();
    onScan(val);
  }

  return (
    <Modal
      open
      title={title}
      onCancel={() => { stopScanner(); onClose(); }}
      footer={null}
      width={360}
      destroyOnHidden
    >
      <div className="space-y-3">
        <div
          id="visitor-qr-reader"
          ref={containerRef}
          className="w-full rounded overflow-hidden"
        />

        {cameraError && (
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-400">Camera not available</p>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={(e) => {
                const div = (e.currentTarget as HTMLElement)
                  .closest(".ant-modal-body")
                  ?.querySelector<HTMLDivElement>("#visitor-qr-reader") ?? null;
                restart(div);
              }}
            >
              Retry
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Enter ID manually…"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            onPressEnter={handleManual}
            size="small"
          />
          <Button size="small" onClick={handleManual}>OK</Button>
        </div>
      </div>
    </Modal>
  );
}
