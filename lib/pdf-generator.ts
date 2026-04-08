/**
 * PDF generator using Playwright + Chromium.
 *
 * Environment strategy:
 *  - Vercel / any serverless  →  @sparticuz/chromium  (downloaded to /tmp at runtime)
 *  - VPS with system Chrome   →  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH env var
 *  - Local dev                →  set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to your Chrome path,
 *                                 e.g. "C:\Program Files\Google\Chrome\Application\chrome.exe"
 *                                 OR run: npx playwright install chromium
 */

import type { Browser } from "playwright-core";

export type PDFFormat = "A4" | "A3" | "Letter";
export type ThermalWidth = "80mm" | "57mm";

export interface PDFOptions {
  /** Use for standard documents (booking confirmation) */
  format?: PDFFormat;
  /** Use for thermal receipts — overrides format */
  thermalWidth?: ThermalWidth;
  printBackground?: boolean;
}

async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright-core");

  // 1. Explicit path override — use this on VPS with a system-installed Chromium/Chrome
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  // 2. Serverless / Vercel — use @sparticuz/chromium (downloads to /tmp on cold start)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === "production") {
    const sparticuz = await import("@sparticuz/chromium");
    const chromiumPkg = sparticuz.default ?? sparticuz;
    return chromium.launch({
      args: chromiumPkg.args,
      executablePath: await chromiumPkg.executablePath(),
      headless: true,
    });
  }

  // 3. Local development — playwright-core will look for a locally installed chromium
  //    Run once: npx playwright install chromium
  return chromium.launch({ headless: true });
}

export async function generatePDF(html: string, options: PDFOptions = {}): Promise<Buffer> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();

    // Load HTML — networkidle ensures Tailwind CDN finishes compiling CSS
    await page.setContent(html, { waitUntil: "networkidle" });

    let pdfBuffer: Buffer;

    if (options.thermalWidth) {
      // Thermal receipt: measure actual content height so the PDF page fits exactly
      const contentHeightPx = await page.evaluate(() => document.body.scrollHeight);
      pdfBuffer = Buffer.from(
        await page.pdf({
          width: options.thermalWidth,
          height: `${contentHeightPx + 24}px`, // +24px bottom breathing room
          printBackground: options.printBackground ?? true,
          margin: { top: "3mm", right: "3mm", bottom: "5mm", left: "3mm" },
        })
      );
    } else {
      // Standard document (A4 etc.)
      pdfBuffer = Buffer.from(
        await page.pdf({
          format: options.format ?? "A4",
          printBackground: options.printBackground ?? true,
          margin: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" },
        })
      );
    }

    await page.close();
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
