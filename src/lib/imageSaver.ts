import { domToPng } from "modern-screenshot";

export interface SaveImageOptions {
  backgroundColor?: string;
  scale?: number;
  quality?: number;
}

export interface SaveImageResult {
  dataUrl: string;
  blob: Blob | null;
  shared: boolean;
  downloadTriggered: boolean;
}

/**
 * Robust cross-device image capture and saving helper.
 * Uses modern-screenshot for DOM image generation, Web Share API for native mobile save to photos,
 * direct download link for desktop, and returns data for preview modal fallback.
 */
export async function captureElementImage(
  element: HTMLElement,
  filename: string,
  options: SaveImageOptions = {}
): Promise<SaveImageResult> {
  const scale = options.scale || 2;
  const backgroundColor = options.backgroundColor || "#ffffff";

  const originalScrollTop = window.scrollY;

  try {
    const dataUrl = await domToPng(element, {
      scale,
      backgroundColor,
      filter: (node) => {
        if (node instanceof HTMLElement && node.classList?.contains("no-export")) {
          return false;
        }
        return true;
      },
    });

    const fetchRes = await fetch(dataUrl);
    const blob = await fetchRes.blob();

    let shared = false;
    let downloadTriggered = false;

    // Check for native Web Share API with files support (iOS Safari & Android Chrome)
    if (blob && typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function") {
      try {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: filename.replace(/_/g, " ").replace(".png", ""),
            text: "Saved with love! 💕",
          });
          shared = true;
        }
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name !== "AbortError") {
          console.warn("Web Share failed, falling back to download:", err);
        }
      }
    }

    // Direct download trigger (Desktop / Web Fallback)
    if (!shared) {
      try {
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        downloadTriggered = true;
      } catch (dlErr) {
        console.error("Direct download link failed:", dlErr);
      }
    }

    return {
      dataUrl,
      blob,
      shared,
      downloadTriggered,
    };
  } finally {
    window.scrollTo({ top: originalScrollTop });
  }
}
