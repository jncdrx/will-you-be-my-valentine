import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, X, Send, Sparkles, AlertCircle, MessageSquare, Camera, Clock, Heart, Hourglass, Smile, Sun, HeartHandshake, BookOpen, ArrowLeft } from "lucide-react";
import { monthsaryConfig } from "../config/monthsaryConfig";
import { saveMonthsaryResponse, MonthsaryResponse, saveAngelUserData } from "../lib/supabase";

interface AngelReactionFormProps {
  onSubmitted: (data: MonthsaryResponse, token: string) => void;
  onBackToMemories: () => void;
  existingToken?: string;
}

// Minimalist icon mapper for playful prompt rotator
function renderPlayfulIcon(iconName: string) {
  switch (iconName) {
    case "Clock":
      return <Clock size={14} className="text-rose-500" />;
    case "Heart":
      return <Heart size={14} className="text-rose-500 fill-rose-500" />;
    case "Sparkles":
      return <Sparkles size={14} className="text-amber-500" />;
    case "Hourglass":
      return <Hourglass size={14} className="text-purple-500" />;
    case "Smile":
      return <Smile size={14} className="text-rose-500" />;
    case "Sun":
      return <Sun size={14} className="text-amber-500" />;
    case "HeartHandshake":
      return <HeartHandshake size={14} className="text-rose-500" />;
    case "BookOpen":
      return <BookOpen size={14} className="text-indigo-500" />;
    default:
      return <Sparkles size={14} className="text-rose-500" />;
  }
}

export function AngelReactionForm({ onSubmitted, onBackToMemories, existingToken }: AngelReactionFormProps) {
  const [name, setName] = useState(monthsaryConfig.girlfriendName);
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Playful typing messages rotator state
  const [isTypingActive, setIsTypingActive] = useState(false);
  const [playfulIndex, setPlayfulIndex] = useState(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Trigger haptic feedback safely
  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // Handle typing detection: trigger playful messages after she types or pauses for 2 seconds
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > 1000) return; // Limit message length
    setMessage(e.target.value);
    setErrorMessage(null);

    if (!isTypingActive) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setIsTypingActive(true);
      }, 2000); // 2 seconds after typing starts
    }
  };

  // Rotate playful messages when typing active
  useEffect(() => {
    if (!isTypingActive) return;

    rotationTimerRef.current = setInterval(() => {
      setPlayfulIndex((prev) => (prev + 1) % monthsaryConfig.playfulTypingMessages.length);
    }, 4500);

    return () => {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    };
  }, [isTypingActive]);

  const processFiles = (files: File[]) => {
    if (files.length === 0) return;

    if (selectedFiles.length + files.length > 5) {
      setErrorMessage("You can upload up to 5 reaction pictures.");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (!validTypes.includes(file.type.toLowerCase())) {
        setErrorMessage("Please upload JPG, JPEG, PNG, or WEBP images only.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" is over 5MB. Please choose a smaller image.`);
        return;
      }

      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    triggerHaptic();
    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    processFiles(Array.from(e.target.files || []));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMessage(null);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    triggerHaptic();
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

const reactionFormSchema = z.object({
  name: z.string().min(1, "Please enter your name, my love."),
  message: z.string().min(1, "Please write a short reply or note for me.").max(1000, "Message cannot exceed 1000 characters."),
});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();

    const validation = reactionFormSchema.safeParse({
      name: name.trim(),
      message: message.trim(),
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0].message;
      setErrorMessage(firstError);
      toast.error(firstError);
      return;
    }

    setIsSubmitting(true);
    setIsTypingActive(false);

    try {
      const { data, error, token } = await saveMonthsaryResponse(
        name.trim(),
        message.trim(),
        selectedFiles,
        existingToken
      );

      if (error || !data) {
        setErrorMessage("Could not save response. Please try again.");
        toast.error("Could not save response. Please try again.");
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem("monthsary_angel_token", token);
      saveAngelUserData({
        name: name.trim(),
        message: message.trim(),
        image_urls: data.image_urls || [],
        current_step: "confirmation",
      });
      toast.success("Reply sent with love! 💕");
      onSubmitted(data, token);
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMessage("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPlayfulMsg = monthsaryConfig.playfulTypingMessages[playfulIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center p-3 sm:p-4 max-w-2xl w-full my-auto z-10 text-center"
    >
      <div className="mb-4">
        <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600 bg-rose-100/80 px-4 py-1.5 rounded-full border border-rose-200 inline-flex items-center gap-1.5 shadow-sm mb-2">
          <MessageSquare size={14} className="text-rose-500" />
          <span>Step 4: My Dearest Baby Angel's Reaction & Reply</span>
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold text-rose-600 font-display">
          Your Turn, My Love, My Baby Angel
        </h2>
        <p className="text-xs sm:text-sm text-rose-900/80 mt-1">
          Write me a reply and send me your favorite photo or selfie!
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full bg-white/85 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/90 shadow-2xl text-left relative overflow-hidden"
      >
        {/* Name Input */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-rose-700 uppercase tracking-wider">
              Your Name
            </label>
            <span className="text-[10px] text-gray-400 font-medium">Editable</span>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my dearest baby angel"
            className="w-full rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 text-sm text-gray-800 font-semibold focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-300/50 transition-all capitalize min-h-[48px]"
            required
          />
        </div>

        {/* Reply Message Textarea */}
        <div className="mb-5 relative">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-rose-700 uppercase tracking-wider">
              Your Message or Reaction
            </label>
            <span className="text-[10px] text-gray-400 font-medium">{message.length} / 1000</span>
          </div>

          <textarea
            rows={4}
            value={message}
            onChange={handleMessageChange}
            placeholder="Tell me how you feel, my love, my dearest baby angel..."
            className="w-full rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-sm sm:text-base text-gray-800 font-sans focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-300/50 transition-all resize-none"
            required
          />

          {/* Playful Typing Prompt Overlay */}
          <AnimatePresence>
            {isTypingActive && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-2 flex items-center gap-2 bg-gradient-to-r from-rose-100 via-pink-100 to-rose-100 border border-rose-200 text-rose-700 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm inline-flex"
              >
                {renderPlayfulIcon(currentPlayfulMsg.icon)}
                <span>{currentPlayfulMsg.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reaction Photo Upload */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <Camera size={14} className="text-rose-500" />
              <span>Upload Photos or Selfies</span>
            </label>
            <span className="text-[10px] text-gray-500 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              {selectedFiles.length} / 5 photos
            </span>
          </div>

          {/* Drag & Drop File Upload Zone */}
          <label
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer p-4 ${
              isDragging
                ? "border-rose-500 bg-rose-100/70 scale-[1.01]"
                : "border-rose-300 bg-rose-50/40 hover:bg-rose-100/50"
            }`}
          >
            <Upload size={24} className="text-rose-500 mb-1.5 animate-bounce" />
            <span className="text-xs font-bold text-rose-700">Tap or drag & drop photos here</span>
            <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WEBP (Max 5MB each)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Image Previews */}
          {filePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
              {filePreviews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-rose-300 shadow-md group">
                  <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(i)}
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-1.5 text-white hover:bg-red-500 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                    aria-label="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl bg-red-50 p-3.5 text-xs font-bold text-red-600 border border-red-200 shadow-sm">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Bottom Actions Row (Back + Submit) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMemories}
            className="flex items-center justify-center gap-1.5 rounded-full bg-rose-50 px-5 py-3.5 text-xs sm:text-sm font-bold text-rose-700 border border-rose-200 shadow-sm hover:bg-rose-100 transition-all min-h-[52px]"
          >
            <ArrowLeft size={16} />
            <span>Memories</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 py-4 font-bold text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 min-h-[52px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Sparkles size={18} className="animate-spin" />
                <span>Sending your reply...</span>
              </span>
            ) : (
              <>
                <Send size={18} />
                <span>Submit My Reply</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
