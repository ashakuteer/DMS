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

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Admin fallback
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

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ── Step 1: Send OTP ─────────────────────────────────────────
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

  // ── Step 2: Verify OTP ───────────────────────────────────────
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

  // ── Resend OTP ───────────────────────────────────────────────
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

  // ── OTP digit input handling ─────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 digits entered
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
    if (pasted.length === 6) {
      setTimeout(() => handleVerifyOtp(), 50);
    }
  };

  // ── Admin email/password fallback ────────────────────────────
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
        style={{ background: "linear-gradient(135deg, #0f2847 0%, #1a4480 45%, #1d4ed8 100%)" }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white opacity-[0.03]" />
          <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-blue-400 opacity-[0.04]" />
          <div className="absolute -bottom-16 right-0 w-72 h-72 rounded-full bg-white opacity-[0.03] translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-8 right-24 w-2 h-2 rounded-full bg-orange-400 opacity-40" />
          <div className="absolute bottom-12 left-20 w-1.5 h-1.5 rounded-full bg-orange-300 opacity-30" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img src="/brand/logo.jpg" alt="Asha Kuteer" className="h-12 w-12 rounded-xl object-cover shadow-lg" />
            <div>
              <h2 className="text-white font-bold text-xl leading-tight">Asha Kuteer</h2>
              <p className="text-blue-200 text-sm">Foundation</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Empowering Compassion Through Smart Donor Management
            </h1>
            <p className="text-blue-100 mt-4 text-lg leading-relaxed">
              Manage donors, campaigns, and impact — all in one place.
            </p>
          </div>
          <div className="space-y-3">
            {features.map(({ icon: Icon, key }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-blue-50 text-sm">{t(key)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-300 text-xs">
            © {new Date().getFullYear()} {t("login.org_name")}. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/brand/logo.jpg"
              alt="Asha Kuteer"
              className="mx-auto h-16 w-16 rounded-xl object-cover shadow-md mb-3"
              data-testid="img-login-logo"
            />
            <h1 className="text-2xl font-bold text-foreground">Asha Kuteer</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("login.subtitle")}</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">

            {/* ── Phone Step ── */}
            {step === "phone" && (
              <>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Enter your registered mobile number to receive a one-time password.
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Mobile Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 rounded-xl border-gray-200 dark:border-gray-700 focus-visible:ring-orange-500"
                      data-testid="input-phone"
                    />
                    <p className="text-xs text-muted-foreground">Include country code, e.g. +91 for India</p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all"
                    disabled={isLoading}
                    data-testid="button-send-otp"
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP...</>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 text-center">
                  <button
                    type="button"
                    onClick={() => setStep("admin")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
                <div className="mb-8">
                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    data-testid="button-back-to-phone"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Change number
                  </button>
                  <h2 className="text-2xl font-bold text-foreground">Enter OTP</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-foreground">{phone}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">6-digit OTP</Label>
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
                          className="w-11 h-13 text-center text-xl font-bold border-2 rounded-xl border-gray-200 dark:border-gray-700 bg-transparent focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50"
                          data-testid={`input-otp-${i}`}
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all"
                    disabled={isLoading || otp.join("").length < 6}
                    data-testid="button-verify-otp"
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </Button>

                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Resend OTP in{" "}
                        <span className="font-semibold text-foreground tabular-nums">{countdown}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium mx-auto transition-colors disabled:opacity-50"
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

            {/* ── Admin Email/Password Fallback ── */}
            {step === "admin" && (
              <>
                <div className="mb-8">
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    data-testid="button-back-to-otp"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to OTP login
                  </button>
                  <h2 className="text-2xl font-bold text-foreground">Admin Login</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Sign in with your email and password.
                  </p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">{t("login.email_label")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("login.email_placeholder")}
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 rounded-xl border-gray-200 dark:border-gray-700 focus-visible:ring-orange-500"
                      data-testid="input-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">{t("login.password_label")}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("login.password_placeholder")}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11 pr-11 rounded-xl border-gray-200 dark:border-gray-700 focus-visible:ring-orange-500"
                        data-testid="input-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all"
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("login.signing_in")}</>
                    ) : (
                      t("login.sign_in")
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>

          <div className="hidden lg:block mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              {t("login.org_name")} · {t("login.subtitle")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
