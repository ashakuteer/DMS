"use client";

import { API_URL } from "@/lib/api-config";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Suspense } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!token.trim()) {
      setError("Reset token is required.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Password reset failed. The token may be invalid or expired.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f2847 0%, #1a4480 45%, #1d4ed8 100%)" }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white opacity-[0.03]" />
          <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-blue-400 opacity-[0.04]" />
          <div className="absolute -bottom-16 right-0 w-72 h-72 rounded-full bg-white opacity-[0.03] translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/brand/logo.jpg"
              alt="Asha Kuteer"
              className="h-12 w-12 rounded-xl object-cover shadow-lg"
            />
            <div>
              <h2 className="text-white font-bold text-xl leading-tight">Asha Kuteer</h2>
              <p className="text-blue-200 text-sm">Foundation</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Set a new password
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Choose a strong password to secure your account.
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-blue-300 text-xs">
            © {new Date().getFullYear()} Asha Kuteer Foundation. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <img
              src="/brand/logo.jpg"
              alt="Asha Kuteer"
              className="mx-auto h-16 w-16 rounded-xl object-cover shadow-md mb-3"
            />
            <h1 className="text-2xl font-bold text-foreground">Asha Kuteer</h1>
            <p className="text-muted-foreground text-sm mt-1">Donor Management System</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
            {success ? (
              <div className="text-center space-y-4" data-testid="section-reset-done">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
                  <ShieldCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Password updated!</h2>
                  <p className="text-muted-foreground text-sm mt-2">
                    Your password has been reset successfully. Redirecting to login…
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5FA8A8] hover:text-[#5FA8A8] transition-colors"
                  data-testid="link-go-login"
                >
                  Go to sign in →
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#E6F4F1] dark:bg-[#5FA8A8]/20 mb-4">
                    <ShieldCheck className="h-6 w-6 text-[#5FA8A8]" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">New password</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Enter your reset token and choose a new password
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="token" className="text-sm font-medium">
                      Reset token
                    </Label>
                    <Input
                      id="token"
                      type="text"
                      placeholder="Paste your reset token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 rounded-xl border-gray-200 dark:border-gray-700 focus-visible:ring-[#5FA8A8] font-mono text-xs"
                      data-testid="input-reset-token"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium">
                      New password
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNew ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11 pr-11 rounded-xl border-gray-200 dark:border-gray-700 focus-visible:ring-[#5FA8A8]"
                        data-testid="input-new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        onClick={() => setShowNew(!showNew)}
                        data-testid="button-toggle-new-password"
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">
                      Confirm password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repeat your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11 pr-11 rounded-xl border-gray-200 dark:border-gray-700 focus-visible:ring-[#5FA8A8]"
                        data-testid="input-confirm-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        onClick={() => setShowConfirm(!showConfirm)}
                        data-testid="button-toggle-confirm-password"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p
                      className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2"
                      data-testid="text-reset-error"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl text-sm font-semibold bg-[#5FA8A8] hover:bg-[#5FA8A8] text-white shadow-md shadow-[#5FA8A8]/20 transition-all"
                    disabled={isLoading}
                    data-testid="button-reset-submit"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              </>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-back-to-login-reset"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </div>
          </div>

          <div className="hidden lg:block mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Asha Kuteer Foundation · Donor Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-[#5FA8A8]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
