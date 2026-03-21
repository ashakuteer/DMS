"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendOtp, verifyOtp, login, getAndClearAuthMessage } from "@/lib/auth";
import {
  Loader2,
  Heart,
  Users,
  TrendingUp,
  Shield,
  Phone,
  ChevronLeft,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type Step = "phone" | "otp" | "admin";

const RESEND_SECONDS = 30;

const TEAL_GRADIENT = "linear-gradient(135deg, #5FA8A8, #7FAFD4)";
const TEAL = "#5FA8A8";
const PRIMARY_TEXT = "#0F172A";
const SECONDARY_TEXT = "#64748B";
const RIGHT_BG = "#F5F7FA";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const msg = getAndClearAuthMessage();
    if (msg) {
      toast({ title: "Session Expired", description: msg, variant: "default" });
    }
  }, [toast]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setIsLoading(true);
    try {
      await sendOtp(phone.trim());
      toast({ title: "OTP Sent", description: "Check your phone for the 6-digit code." });
      setStep("otp");
      setCountdown(RESEND_SECONDS);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to Send OTP", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast({ variant: "destructive", title: "Incomplete OTP", description: "Please enter all 6 digits." });
      return;
    }
    setIsLoading(true);
    try {
      await verifyOtp(phone.trim(), code);
      toast({ title: "Welcome!", description: "Login successful." });
      router.push("/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: err.message });
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      await sendOtp(phone.trim());
      toast({ title: "OTP Resent", description: "A new OTP has been sent to your phone." });
      setOtp(["", "", "", "", "", ""]);
      setCountdown(RESEND_SECONDS);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to Resend", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (digit && index === 5 && next.every(Boolean)) {
      setTimeout(() => handleVerifyOtp(), 50);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) setTimeout(() => handleVerifyOtp(), 50);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(adminEmail, adminPassword);
      toast({ title: "Welcome!", description: "Login successful." });
      router.push("/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Login Failed", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Heart, key: "login.feature_donors" },
    { icon: Users, key: "login.feature_beneficiaries" },
    { icon: TrendingUp, key: "login.feature_analytics" },
    { icon: Shield, key: "login.feature_security" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: TEAL_GRADIENT }}
      >
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white opacity-[0.06]" />
          <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-white opacity-[0.04]" />
          <div className="absolute -bottom-16 right-0 w-72 h-72 rounded-full bg-white opacity-[0.05] translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-8 right-24 w-2 h-2 rounded-full bg-white opacity-30" />
          <div className="absolute bottom-12 left-20 w-1.5 h-1.5 rounded-full bg-white opacity-25" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img src="/brand/logo.jpg" alt="Asha Kuteer" className="h-12 w-12 rounded-xl object-cover shadow-lg" />
            <div>
              <h2 className="text-white font-bold text-xl leading-tight">Asha Kuteer</h2>
              <p className="text-white/70 text-sm">Foundation</p>
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Empowering Compassion Through Smart Donor Management
            </h1>
            <p className="text-white/80 mt-4 text-lg leading-relaxed">
              Manage donors, campaigns, and impact — all in one place.
            </p>
          </div>
          <div className="space-y-3">
            {features.map(({ icon: Icon, key }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-white/90 text-sm">{t(key)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/50 text-xs">
            © {new Date().getFullYear()} {t("login.org_name")}. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-8"
        style={{ background: RIGHT_BG }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/brand/logo.jpg"
              alt="Asha Kuteer"
              className="mx-auto h-16 w-16 rounded-xl object-cover shadow-md mb-3"
              data-testid="img-login-logo"
            />
            <h1 className="text-2xl font-bold" style={{ color: PRIMARY_TEXT }}>Asha Kuteer</h1>
            <p className="text-sm mt-1" style={{ color: SECONDARY_TEXT }}>{t("login.subtitle")}</p>
          </div>

          {/* Card */}
          <div
            className="bg-white"
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              padding: 32,
            }}
          >
            {/* ── Phone Step ── */}
            {step === "phone" && (
              <>
                <div className="mb-7">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(95,168,168,0.12)" }}
                    >
                      <Phone className="h-4 w-4" style={{ color: TEAL }} />
                    </div>
                    <h2 className="text-2xl font-bold" style={{ color: PRIMARY_TEXT }}>Sign In</h2>
                  </div>
                  <p className="text-sm" style={{ color: SECONDARY_TEXT }}>
                    Enter your registered mobile number to receive a one-time password.
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-medium" style={{ color: PRIMARY_TEXT }}>
                      Mobile Number
                    </Label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full h-11 px-3 text-sm rounded-xl border outline-none transition-all disabled:opacity-50"
                      style={{
                        borderColor: "#E2E8F0",
                        color: PRIMARY_TEXT,
                        background: "#fff",
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(95,168,168,0.15)`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
                      data-testid="input-phone"
                    />
                    <p className="text-xs" style={{ color: SECONDARY_TEXT }}>Include country code, e.g. +91 for India</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center"
                    style={{ background: TEAL_GRADIENT }}
                    data-testid="button-send-otp"
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP...</>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 text-center" style={{ borderTop: "1px solid #F1F5F9" }}>
                  <button
                    type="button"
                    onClick={() => setStep("admin")}
                    className="text-xs transition-colors"
                    style={{ color: SECONDARY_TEXT }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = PRIMARY_TEXT; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = SECONDARY_TEXT; }}
                    data-testid="link-admin-login"
                  >
                    Admin login (email & password)
                  </button>
                </div>
              </>
            )}

            {/* ── OTP Step ── */}
            {step === "otp" && (
              <>
                <div className="mb-7">
                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); }}
                    className="flex items-center gap-1 text-sm mb-4 transition-colors"
                    style={{ color: SECONDARY_TEXT }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = PRIMARY_TEXT; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = SECONDARY_TEXT; }}
                    data-testid="button-back-to-phone"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Change number
                  </button>
                  <h2 className="text-2xl font-bold" style={{ color: PRIMARY_TEXT }}>Enter OTP</h2>
                  <p className="text-sm mt-1" style={{ color: SECONDARY_TEXT }}>
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold" style={{ color: PRIMARY_TEXT }}>{phone}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium" style={{ color: PRIMARY_TEXT }}>6-digit OTP</Label>
                    <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          disabled={isLoading}
                          className="w-11 h-12 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all disabled:opacity-50"
                          style={{
                            borderColor: digit ? TEAL : "#E2E8F0",
                            color: PRIMARY_TEXT,
                            background: digit ? "rgba(95,168,168,0.06)" : "#fff",
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(95,168,168,0.15)`; }}
                          onBlur={e => { e.currentTarget.style.boxShadow = "none"; if (!digit) e.currentTarget.style.borderColor = "#E2E8F0"; }}
                          data-testid={`input-otp-${i}`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.join("").length < 6}
                    className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center"
                    style={{ background: TEAL_GRADIENT }}
                    data-testid="button-verify-otp"
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </button>

                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-sm" style={{ color: SECONDARY_TEXT }}>
                        Resend OTP in{" "}
                        <span className="font-semibold tabular-nums" style={{ color: PRIMARY_TEXT }}>{countdown}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 text-sm font-medium mx-auto transition-colors disabled:opacity-50"
                        style={{ color: TEAL }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                        data-testid="button-resend-otp"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}

            {/* ── Admin Email/Password ── */}
            {step === "admin" && (
              <>
                <div className="mb-7">
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="flex items-center gap-1 text-sm mb-4 transition-colors"
                    style={{ color: SECONDARY_TEXT }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = PRIMARY_TEXT; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = SECONDARY_TEXT; }}
                    data-testid="button-back-to-otp"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to OTP login
                  </button>
                  <h2 className="text-2xl font-bold" style={{ color: PRIMARY_TEXT }}>Admin Login</h2>
                  <p className="text-sm mt-1" style={{ color: SECONDARY_TEXT }}>
                    Sign in with your email and password.
                  </p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium" style={{ color: PRIMARY_TEXT }}>
                      {t("login.email_label")}
                    </Label>
                    <input
                      id="email"
                      type="email"
                      placeholder={t("login.email_placeholder")}
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full h-11 px-3 text-sm rounded-xl border outline-none transition-all disabled:opacity-50"
                      style={{ borderColor: "#E2E8F0", color: PRIMARY_TEXT, background: "#fff" }}
                      onFocus={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(95,168,168,0.15)`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
                      data-testid="input-email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium" style={{ color: PRIMARY_TEXT }}>
                      {t("login.password_label")}
                    </Label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("login.password_placeholder")}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full h-11 pl-3 pr-11 text-sm rounded-xl border outline-none transition-all disabled:opacity-50"
                        style={{ borderColor: "#E2E8F0", color: PRIMARY_TEXT, background: "#fff" }}
                        onFocus={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(95,168,168,0.15)`; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
                        data-testid="input-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "#94A3B8" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = SECONDARY_TEXT; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center"
                    style={{ background: TEAL_GRADIENT }}
                    data-testid="button-login"
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("login.signing_in")}</>
                    ) : (
                      t("login.sign_in")
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="hidden lg:block mt-6 text-center">
            <p className="text-xs" style={{ color: SECONDARY_TEXT }}>
              {t("login.org_name")} · {t("login.subtitle")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
