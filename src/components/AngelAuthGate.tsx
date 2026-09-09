import { useEffect, useRef, useState, type FormEvent } from "react";
import { Heart, Lock, Mail, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { RECIPIENT_EMAIL, requestRecipientCode, verifyRecipientCode } from "../lib/auth";

export function AngelAuthGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const pending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const remaining = Math.max(0, Math.ceil((resendAt - now) / 1000));

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { document.body.style.overflow = previous; window.clearInterval(timer); };
  }, []);
  useEffect(() => { if (sent) input.current?.focus(); }, [sent]);

  const send = async () => {
    if (pending.current || Date.now() < resendAt) return;
    pending.current = true; setBusy(true); setError(""); setNotice("");
    setResendAt(Date.now() + 60000); setNow(Date.now());
    try {
      await requestRecipientCode();
      setSent(true); setCode("");
      setNotice("Code requested. Check your inbox or spam folder and use the latest email.");
      input.current?.focus();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not send the code. Please try again."); }
    finally { pending.current = false; setBusy(false); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!sent) { await send(); return; }
    if (pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try { await verifyRecipientCode(code); onUnlocked(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not verify the code."); }
    finally { pending.current = false; setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-[#f3e9e7] bg-[radial-gradient(ellipse_at_top,#fffaf5,transparent_70%)] px-4 py-6 sm:py-10">
      <section aria-labelledby="angel-welcome" className="relative my-auto w-full max-w-[460px] shrink-0 rounded-[28px] border border-white bg-[#fffdfa] p-6 text-left shadow-[0_24px_80px_-32px_#70404c55] sm:p-10">
        <div aria-hidden="true" className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e8d6d8] bg-[#f5e9eb] text-[#8b4759]"><Heart size={23} strokeWidth={1.5} /></div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#976474]">A little world, just for you</p>
        <h1 id="angel-welcome" className="font-serif text-[36px] font-normal leading-[1.12] tracking-[-0.04em] text-[#502f3a] sm:text-[42px]">{sent ? "Check your inbox," : "Welcome home,"}<br /><span className="italic text-[#9c5367]">my baby angel.</span></h1>
        <p className="mb-7 mt-4 text-sm leading-6 text-[#796b70]">{sent ? "Enter the one-time code from your email to open your personal page." : "Your little world is one code away. We’ll email you a sign-in code—no password needed."}</p>
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#eadde0] bg-[#f8f0f1] p-4 text-[#60434e]">
          <Mail size={19} className="shrink-0" aria-hidden="true" />
          <div className="min-w-0"><p className="mb-1 text-[11px] text-[#927881]">Your sign-in email</p><p className="break-all text-sm font-medium">{RECIPIENT_EMAIL}</p></div>
        </div>
        <form onSubmit={submit} aria-busy={busy} className="space-y-5">
          {sent && <div>
            <label htmlFor="angel-code" className="mb-2 block text-xs font-semibold text-[#60434e]">Email verification code</label>
            <input ref={input} id="angel-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }} required minLength={6} maxLength={10} pattern="[0-9]{6,10}" placeholder="Enter your code" aria-describedby={error ? "otp-error otp-help" : "otp-help"} aria-invalid={Boolean(error)} className="min-h-[56px] w-full rounded-xl border border-[#dfd3d6] bg-white px-4 py-3 text-center text-xl tracking-[0.18em] text-[#42363b] placeholder:text-base placeholder:tracking-normal placeholder:text-[#a1959a] focus:border-[#a56175] focus:outline-none focus:ring-4 focus:ring-[#a56175]/10" />
            <p id="otp-help" className="mt-2 text-xs leading-5 text-[#927881]">You can paste the full code. Each code works once.</p>
          </div>}
          {notice && <p role="status" className="text-xs leading-5 text-[#557160]">{notice}</p>}
          {error && <div id="otp-error" role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={17} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
          <button type="submit" disabled={busy || (!sent && remaining > 0)} className="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-xl bg-[#8b4058] px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#723348] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8b4058] disabled:cursor-wait disabled:opacity-60">
            {busy ? <RefreshCw size={17} className="animate-spin motion-reduce:animate-none" /> : <ArrowRight size={17} />}
            {busy ? "Please wait…" : sent ? "Verify & open my page" : remaining > 0 ? `Try again in ${remaining}s` : "Send me a sign-in code"}
          </button>
          {sent && <button type="button" onClick={send} disabled={busy || remaining > 0} className="min-h-11 w-full rounded-lg text-sm font-medium text-[#8b4058] underline decoration-[#dbc5cc] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8b4058] disabled:text-[#927881] disabled:no-underline">{remaining > 0 ? `Resend code in ${remaining}s` : "Send a new code"}</button>}
        </form>
        <div className="mt-7 flex items-start justify-center gap-2 border-t border-[#eee3e5] pt-5 text-center text-[11px] leading-5 text-[#927881]"><Lock size={12} className="mt-1 shrink-0" /><span>Made exclusively for my dearest baby angel</span></div>
      </section>
    </div>
  );
}
