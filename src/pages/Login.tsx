import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Users, LogIn, Mail, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Forgot password dialog state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate("/onboarding");
    }

    setIsLoading(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);

    const { data, error } = await supabase.functions.invoke("generate-recovery-link", {
      body: { email: forgotEmail },
    });

    if (error || data?.error) {
      toast({
        title: "Request failed",
        description: data?.error || error.message,
        variant: "destructive",
      });
    } else if (data?.link) {
      setResetLink(data.link);
      toast({
        title: "Reset link ready",
        description: "Click the link in the dialog to reset your password.",
      });
    } else {
      toast({
        title: "Request failed",
        description: "Unable to generate a reset link.",
        variant: "destructive",
      });
    }

    setForgotLoading(false);
  };

  const openForgot = () => {
    setResetLink(null);
    setForgotEmail("");
    setForgotOpen(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <Users className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to Community Hub</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
            <div className="flex flex-col gap-2 w-full">
              <p className="text-sm text-muted-foreground text-center">
                <button
                  type="button"
                  onClick={openForgot}
                  className="text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Mail className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Reset Password</DialogTitle>
            <DialogDescription className="text-center">
              {resetLink
                ? "Your reset link is ready below"
                : "Enter your email to generate a reset link"}
            </DialogDescription>
          </DialogHeader>

          {resetLink ? (
            <div className="space-y-4 px-6 pb-6">
              <p className="text-sm text-muted-foreground text-center">
                Click the link below to reset the password for{" "}
                <span className="font-medium text-foreground">{forgotEmail}</span>. The link
                expires in 1 hour.
              </p>
              <a href={resetLink} className="block w-full">
                <Button type="button" className="w-full" asChild>
                  <span className="flex items-center justify-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open Reset Link
                  </span>
                </Button>
              </a>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setResetLink(null);
                  setForgotEmail("");
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit}>
              <div className="px-6 py-2 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@company.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter className="px-6 pb-6">
                <Button type="submit" className="w-full" disabled={forgotLoading}>
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
