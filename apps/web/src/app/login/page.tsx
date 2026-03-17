"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { login, getAndClearAuthMessage } from "@/lib/auth";
import { Loader2, Eye, EyeOff, Heart, Users, TrendingUp, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const authMessage = getAndClearAuthMessage();
    if (authMessage) {
      toast({
        title: "Session Expired",
        description: authMessage,
        variant: "default",
      });
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Heart, text: "Track donor relationships & giving history" },
    { icon: Users, text: "Manage beneficiaries across all homes" },
    { icon: TrendingUp, text: "Real-time analytics & impact reports" },
    { icon: Shield, text: "Role-based access with full audit trail" },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #ea580c 0%, #f97316 40%, #fb923c 100%)" }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-white" />
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
              <p className="text-orange-100 text-sm">Foundation</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Empowering Compassion Through Smart Donor Management
            </h1>
            <p className="text-orange-100 mt-4 text-lg leading-relaxed">
              Manage donors, campaigns, and impact — all in one place.
            </p>
          </div>

          <div className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-orange-50 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-orange-200 text-xs">
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
              data-testid="img-login-logo"
            />
            <h1 className="text-2xl font-bold text-foreground">Asha Kuteer</h1>
            <p className="text-muted-foreground text-sm mt-1">Donor Management System</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">Sign in</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@ngo.org"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-11 rounded-xl border-gray-200 dark:border-gray-700 focus-visible:ring-orange-500"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
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
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
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
