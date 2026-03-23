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

const INPUT_STYLE: React.CSSProperties = {
  height: 42,
  borderRadius: 8,
  borderColor: "#E2E8F0",
  color: PRIMARY_TEXT,
  background: "#fff",
};

const BTN_STYLE: React.CSSProperties = {
  background: TEAL_GRADIENT,
  height: 42,
  borderRadius: 8,
};

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

      {/* ── Left panel (60%) ── */}
      <div
        className="hidden lg:flex lg:w-[60%] relative flex-col justify-between overflow-hidden"
        style={{ background: TEAL_GRADIENT, padding: 48 }}
      >
        {/* Subtle decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white opacity-[0.05]" />
          <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-[480px] h-[480px] rounded-full bg-white opacity-[0.03]" />
          <div className="absolute -bottom-16 right-0 w-72 h-72 rounded-full bg-white opacity-[0.04] translate-x-1/4 translate-y-1/4" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="/brand/logo.jpg" alt="Asha Kuteer" className="h-11 w-11 rounded-xl object-cover shadow-md" />
            <div>
              <p className="text-white font-semibold text-base leading-tight">Asha Kuteer</p>
              <p className="text-white/60 text-xs">Foundation</p>
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <div>
            <p
              className="font-semibold text-white leading-snug"
              style={{ fontSize: 24 }}
            >
              Empowering Compassion Through Smart Donor Management
            </p>
            <p className="text-white/85 mt-3 leading-relaxed" style={{ fontSize: 15 }}>
              Manage donors, campaigns, and impact — all in one place.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {features.map(({ icon: Icon, key }) => (
              <div key={key} className="flex items-center gap-3">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-white/90 text-sm">{t(key)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/45 text-xs">
            © {new Date().getFullYear()} {t("login.org_name")}. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right panel (40%) ── */}
      <div
        className="flex-1 lg:w-[40%] flex flex-col items-center justify-center p-8"
        style={{ background: "#F5F7FA" }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8">
          <img
            src="/brand/logo.jpg"
            alt="Asha Kuteer"
            className="mx-auto h-14 w-14 rounded-xl object-cover shadow-md mb-3"
            data-testid="img-login-logo"
          />
          <p className="text-lg font-semibold" style={{ color: PRIMARY_TEXT }}>Asha Kuteer</p>
          <p className="text-sm mt-0.5" style={{ color: SECONDARY_TEXT }}>{t("login.subtitle")}</p>
        </div>

        {/* Card */}
        <div
          style={{
            width: 340,
            maxWidth: "100%",
            background: "#FFFFFF",
            borderRadius: 12,
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            padding: 24,
          }}
        >

          {/* ── Phone Step ── */}
          {step === "phone" && (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(95,168,168,0.12)" }}
                  >
                    <Phone className="h-3.5 w-3.5" style={{ color: TEAL }} />
                  </div>
                  <p className="font-semibold" style={{ fontSize: 18, color: PRIMARY_TEXT }}>Sign In</p>
                </div>
                <p className="text-sm" style={{ color: SECONDARY_TEXT }}>
                  Enter your registered mobile number to receive a one-time password.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
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
                    className="w-full px-3 text-sm border outline-none transition-all disabled:opacity-50"
                    style={INPUT_STYLE}
                    onFocus={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(95,168,168,0.12)`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
                    data-testid="input-phone"
                  />
                  <p className="text-xs" style={{ color: SECONDARY_TEXT }}>Include country code, e.g. +91 for India</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-sm font-medium text-white transition-opacity disabled:opacity-60 flex items-center justify-center"
                  style={BTN_STYLE}
                  data-testid="button-send-otp"
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP...</>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </form>

              <div className="mt-5 pt-4 text-center" style={{ borderTop: "1px solid #F1F5F9" }}>
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
              <div className="mb-6">
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
                <p className="font-semibold" style={{ fontSize: 18, color: PRIMARY_TEXT }}>Enter OTP</p>
                <p className="text-sm mt-1" style={{ color: SECONDARY_TEXT }}>
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold" style={{ color: PRIMARY_TEXT }}>{phone}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
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
                        className="w-11 h-11 text-center text-lg font-bold border-2 outline-none transition-all disabled:opacity-50"
                        style={{
                          borderRadius: 8,
                          borderColor: digit ? TEAL : "#E2E8F0",
                          color: PRIMARY_TEXT,
                          background: digit ? "rgba(95,168,168,0.06)" : "#fff",
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(95,168,168,0.12)`; }}
                        onBlur={e => { e.currentTarget.style.boxShadow = "none"; if (!digit) e.currentTarget.style.borderColor = "#E2E8F0"; }}
                        data-testid={`input-otp-${i}`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.join("").length < 6}
                  className="w-full text-sm font-medium text-white transition-opacity disabled:opacity-60 flex items-center justify-center"
                  style={BTN_STYLE}
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
                      className="flex items-center gap-1.5 text-sm font-medium mx-auto transition-opacity disabled:opacity-50"
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
              <div className="mb-6">
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
                <p className="font-semibold" style={{ fontSize: 18, color: PRIMARY_TEXT }}>Admin Login</p>
                <p className="text-sm mt-1" style={{ color: SECONDARY_TEXT }}>
                  Sign in with your email and password.
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
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
                    className="w-full px-3 text-sm border outline-none transition-all disabled:opacity-50"
                    style={INPUT_STYLE}
                    onFocus={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(95,168,168,0.12)`; }}
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
                      className="w-full pl-3 pr-10 text-sm border outline-none transition-all disabled:opacity-50"
                      style={INPUT_STYLE}
                      onFocus={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(95,168,168,0.12)`; }}
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
                  className="w-full text-sm font-medium text-white transition-opacity disabled:opacity-60 flex items-center justify-center"
                  style={BTN_STYLE}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("login.signing_in")}</>
                  ) : (
                    t("login.sign_in")
                  )}
                </button>

                <div className="text-center pt-1">
                  <a
                    href="/forgot-password"
                    className="text-xs transition-colors"
                    style={{ color: TEAL }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                    data-testid="link-forgot-password"
                  >
                    Forgot Password?
                  </a>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="hidden lg:block mt-5 text-center">
          <p className="text-xs" style={{ color: SECONDARY_TEXT }}>
            {t("login.org_name")} · {t("login.subtitle")}
          </p>
        </div>
      </div>
    </div>
  );
}
