import { useState } from "react";
import { ArrowLeft, ExternalLink, Printer, Sparkles } from "lucide-react";
import { netflixSound } from "../lib/netflixSound";

interface FolioExperienceProps {
  onBackToHub: () => void;
}

export function FolioExperience({ onBackToHub }: FolioExperienceProps) {
  const [showPrintHint, setShowPrintHint] = useState(false);

  const handleBack = () => {
    netflixSound.playBack();
    onBackToHub();
  };

  return (
    <div className="relative h-screen supports-[height:100dvh]:h-[100dvh] min-h-0 w-full flex flex-col overflow-hidden bg-[#f5f3ef] text-[#292d30] font-sans">
      {/* Top Navigation Bar */}
      <header className="relative z-30 shrink-0 flex items-center justify-between gap-2 px-2 sm:px-6 min-h-14 py-1 bg-[#fcfbf8] border-b border-[#e6e1db] shadow-sm">
        {/* Left: Back to Hub */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleBack}
            className="inline-flex shrink-0 min-h-11 min-w-11 items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#ded7ce] text-xs font-semibold text-[#512735] hover:bg-[#f2e8ea] hover:border-[#bd8d9a] transition-all shadow-xs active:scale-95"
            title="Return to Experience Hub"
            aria-label="Back to Experience Hub"
          >
            <ArrowLeft size={14} />
            <span className="hidden lg:inline">Back to Hub</span>
          </button>

          <div className="h-4 w-px bg-[#e6e1db] hidden sm:block" />

          {/* Folio Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-7 rounded-sm bg-[#743648] text-white flex items-center justify-center font-serif text-sm font-bold shadow-xs">
              f.
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif font-bold text-base text-[#512735] tracking-tight">
                folio.
              </span>
              <span className="hidden xl:inline text-[11px] text-[#75736e] font-medium">
                Handwritten Pharmacology Notebook
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f2e8ea] text-[#743648] border border-[#bd8d9a]/30">
              121 Entries
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Print Tip Toggle */}
          <button
            onClick={() => setShowPrintHint(!showPrintHint)}
            className="hidden sm:inline-flex min-h-11 items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#75736e] hover:text-[#512735] hover:bg-[#f2e8ea]/50 transition-colors"
            title="A5 Printing Tips"
          >
            <Printer size={13} />
            <span>Print Tips</span>
          </button>

          {/* Open in New Window */}
          <a
            href="./folio/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#743648] hover:bg-[#512735] text-white text-xs font-medium transition-all shadow-xs active:scale-95"
            aria-label="Open folio in a standalone window"
            title="Open in Full Standalone Window"
          >
            <span className="hidden sm:inline">Open Standalone</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </header>

      {/* Print Hint Banner */}
      {showPrintHint && (
        <div className="shrink-0 max-h-[30dvh] overflow-y-auto bg-[#faf5e9] border-b border-[#e7ddce] px-4 py-2 text-xs text-[#7e6a44] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#a76172] shrink-0" />
            <span>
              <strong>Printing on A5 Refill Paper:</strong> Select <em>Existing planner paper</em> in Page setup, set scale to <strong>100% / Actual size</strong> in your printer dialog, and disable browser headers & footers.
            </span>
          </div>
          <button
            onClick={() => setShowPrintHint(false)}
            className="shrink-0 min-h-11 min-w-11 text-xs font-bold px-2 py-0.5 hover:bg-[#e7ddce]/40 rounded"
            aria-label="Close print tips"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Full-Height Embedded Iframe */}
      <main className="flex-1 min-h-0 min-w-0 w-full flex flex-col relative">
        <iframe
          src="./folio/index.html"
          title="Folio — Complete Handwritten Pharmacology Notebook"
          className="block h-full min-h-0 w-full flex-1 border-0"
          allow="clipboard-write"
        />
      </main>
    </div>
  );
}
