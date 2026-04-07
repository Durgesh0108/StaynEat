"use client";

import dynamic from "next/dynamic";
import { Download, QrCode } from "lucide-react";
import { useRef } from "react";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeSVG),
  { ssr: false }
);

interface QRCodeDisplayProps {
  url: string;
  label?: string;
  size?: number;
  showDownload?: boolean;
}

export function QRCodeDisplay({
  url,
  label,
  size = 180,
  showDownload = true,
}: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = size + 40;
    canvas.height = size + 60;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20, size, size);
      if (label) {
        ctx.fillStyle = "#374151";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(label, canvas.width / 2, size + 45);
      }
      const link = document.createElement("a");
      link.download = `qr-${label ?? "code"}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={qrRef}
        className="p-4 bg-white dark:bg-white rounded-2xl shadow-sm border border-gray-100"
      >
        {url ? (
          <QRCodeSVG
            value={url}
            size={size}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: "/logo-icon.png",
              x: undefined,
              y: undefined,
              height: 32,
              width: 32,
              excavate: true,
            }}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-gray-100"
            style={{ width: size, height: size }}
          >
            <QrCode className="h-12 w-12 text-gray-300" />
          </div>
        )}
      </div>
      {label && (
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
      )}
      {showDownload && url && (
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download QR
        </button>
      )}
    </div>
  );
}
