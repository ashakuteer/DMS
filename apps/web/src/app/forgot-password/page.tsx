"use client";

import { API_URL } from "@/lib/api-config";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, User, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
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
            Forgot your password?
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Enter your username or email address and the admin will receive a secure reset link.
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
            {!submitted ? (
              <>
                <div className="mb-8">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
                    <User className="h-6 w-6 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Reset password</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Enter your username or email to request a password reset
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Username or Email
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="e.g. admin or staff@ashakuteer.org"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="username"
                      className="h-11 rounded-xl border-gray-200 dark:border-gray-700 focus-visible:ring-orange-500"
                      data-testid="input-forgot-username"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your username (if assigned) or your email address.
                    </p>
                  </div>

                  {error && (
                    <p
                      className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2"
                      data-testid="text-forgot-error"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all"
                    disabled={isLoading}
                    data-testid="button-send-reset"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Request"
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center space-y-4" data-testid="section-reset-success">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
                  <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Request sent!</h2>
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                    If <strong className="text-foreground font-semibold">{username}</strong> matches an account,
                    the admin has received a reset link at the registered inbox.
                    <br /><br />
                    Please contact your admin to get the new password.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-back-to-login"
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
