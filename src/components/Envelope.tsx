import { useState } from "react";


export function Envelope({ onOpen, onClose }: { onOpen?: () => void; onClose?: () => void }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = () => {
        if (!isOpen) {
            setIsOpen(true);
            setTimeout(() => {
                onOpen?.();
            }, 800); // Wait for animation
        } else {
            setIsOpen(false);
            onClose?.();
        }
    };

    return (
        <div className="envelope-wrapper flex flex-col items-center justify-center py-12" onClick={handleOpen}>
            <div className={`relative w-64 h-48 bg-rose-300 cursor-pointer shadow-xl transition-transform duration-500 hover:scale-105 envelope ${isOpen ? 'open' : ''}`}>

                {/* Envelope Flap */}
                <div className="absolute top-0 left-0 w-full h-0 border-l-[128px] border-l-transparent border-r-[128px] border-r-transparent border-t-[80px] border-t-rose-400 origin-top flap z-30"></div>

                {/* Envelope Pocket */}
                <div className="absolute bottom-0 left-0 w-full h-full border-l-[128px] border-l-rose-200 border-r-[128px] border-r-rose-200 border-b-[96px] border-b-rose-300 z-20 pointer-events-none"></div>

                {/* Letter */}
                <div className="absolute top-2 left-4 right-4 bottom-2 bg-white rounded-lg shadow-sm p-4 flex flex-col items-center justify-center letter-content z-10 transition-all duration-500">
                    <div className="text-xs text-center text-gray-500 font-serif">
                        To: Angelica<br />
                        From: Baby
                    </div>
                    <div className="mt-2 w-full h-px bg-gray-200"></div>
                    <div className="mt-2 text-[10px] text-gray-400 text-center">
                        (Click to Read)
                    </div>
                </div>
            </div>
            <p className="mt-8 text-rose-500 animate-pulse font-bold tracking-widest uppercase text-sm">
                {isOpen ? "Tap card to close" : "Tap envelope to open"}
            </p>
        </div>
    );
}
