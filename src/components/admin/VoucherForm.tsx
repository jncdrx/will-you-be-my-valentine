import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Image as ImageIcon, X, Save, Send, Loader2, Sparkles } from "lucide-react";
import {
  VoucherType,
  VOUCHER_TYPE_LABELS,
  voucherSchema,
  uploadVoucherImage,
  createVoucher,
  updateVoucher,
  listProfiles,
  Voucher,
} from "../../lib/vouchers";
import { RecipientSelector } from "./RecipientSelector";

const TYPES = Object.keys(VOUCHER_TYPE_LABELS) as VoucherType[];

interface VoucherFormProps {
  onClose: () => void;
  onSaved: () => void;
  editing?: Voucher | null;
}

export function VoucherForm({ onClose, onSaved, editing }: VoucherFormProps) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [voucherType, setVoucherType] = useState<VoucherType>(
    (editing?.voucher_type as VoucherType) ?? "nail"
  );
  const [instructions, setInstructions] = useState(editing?.instructions ?? "");
  const [recipientId, setRecipientId] = useState(editing?.recipient_id ?? "");
  const [expiresAt, setExpiresAt] = useState<string>(
    editing?.expires_at ? editing.expires_at.slice(0, 10) : ""
  );
  const [nonExpiring, setNonExpiring] = useState<boolean>(!editing?.expires_at);
  const [imageUrl, setImageUrl] = useState<string | null>(editing?.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState<"draft" | "send" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!recipientId) {
      listProfiles().then((profiles) => {
        if (profiles.length > 0 && !recipientId) {
          const recipientProfile = profiles.find((p) => p.role !== "admin") || profiles[0];
          setRecipientId(recipientProfile.id);
        }
      });
    }
  }, [recipientId]);

  const handleImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadVoucherImage(file);
      setImageUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    if (!nonExpiring && !expiresAt) {
      setErrors((prev) => ({
        ...prev,
        expires_at: "Please select an expiration date or mark as non-expiring.",
      }));
      return null;
    }
    const parsed = voucherSchema.safeParse({
      title,
      description,
      voucher_type: voucherType,
      instructions,
      recipient_id: recipientId,
      expires_at: nonExpiring ? null : expiresAt || null,
      image_url: imageUrl,
    });
    if (parsed.success) {
      setErrors({});
      return parsed.data;
    }
    const next: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return null;
  };

  const handleSave = async (send: boolean) => {
    const data = validate();
    if (!data) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    if (send && !data.recipient_id) {
      setErrors((e) => ({ ...e, recipient_id: "Select a recipient before sending." }));
      return;
    }
    setSaving(send ? "send" : "draft");
    try {
      if (editing) {
        await updateVoucher(editing.id, {
          title: data.title,
          description: data.description,
          voucher_type: data.voucher_type,
          instructions: data.instructions,
          recipient_id: data.recipient_id,
          expires_at: data.expires_at,
          image_url: data.image_url,
          send: send && editing.status === "draft",
        });
        toast.success(send ? "Voucher sent." : "Draft saved.");
      } else {
        await createVoucher({
          title: data.title,
          description: data.description,
          voucher_type: data.voucher_type,
          instructions: data.instructions,
          recipient_id: data.recipient_id,
          expires_at: data.expires_at,
          image_url: data.image_url,
          send,
        });
        toast.success(send ? "Voucher sent." : "Draft saved.");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full bg-slate-800 p-2 text-slate-400 hover:text-slate-200"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
          <Sparkles size={20} className="text-indigo-400" />
          {editing ? "Edit Voucher" : "Create Voucher"}
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          {editing
            ? "Edit a not-yet-claimed voucher. Changes appear on the recipient's screen instantly."
            : "Fill the details below, then save as a draft or send immediately."}
        </p>

        <div className="space-y-5">
          {/* Image */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Voucher Image
            </label>
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 shrink-0 rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="voucher" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-xs font-bold hover:bg-slate-800">
                  {uploading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <ImageIcon size={15} /> Choose image
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImage(f);
                    }}
                  />
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="ml-2 text-xs text-slate-500 hover:text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Premium Nail Care & Nail Art Session"
              className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 min-h-[48px]"
            />
            {errors.title && <p className="mt-1 text-[11px] font-semibold text-red-400">{errors.title}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Voucher Type
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setVoucherType(t)}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold border transition-all ${
                    voucherType === t
                      ? "bg-indigo-500 text-white border-indigo-500"
                      : "bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  {VOUCHER_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Message / Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="A personal message for the recipient…"
              className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              How to Use
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="Redemption instructions…"
              className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Recipient */}
          <RecipientSelector
            value={recipientId}
            onChange={setRecipientId}
            error={errors.recipient_id}
          />

          {/* Expiration */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Expiration
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 mb-2">
              <input
                type="checkbox"
                checked={nonExpiring}
                onChange={(e) => setNonExpiring(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800"
              />
              Non-expiring (forever valid)
            </label>
            {!nonExpiring && (
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 min-h-[48px]"
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving !== null}
            className="flex-1 rounded-2xl border border-slate-700 bg-slate-800/60 py-3.5 text-sm font-bold text-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
          >
            {saving === "draft" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving !== null}
            className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
          >
            {saving === "send" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send Now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}