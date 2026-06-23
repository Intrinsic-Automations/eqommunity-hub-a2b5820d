import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, Copy, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLink(null);

    const { data, error } = await supabase.functions.invoke("generate-recovery-link", {
      body: {
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      },
    });

    if (error || !data?.action_link) {
      toast({
        title: "Request failed",
        description: (data as any)?.error || error?.message || "Unable to generate link",
        variant: "destructive",
      });
    } else {
      setLink(data.action_link);
      toast({
        title: "Link generated",
        description: "Copy the link below and share it with the user.",
      });
    }

    setIsLoading(false);
  };

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <Mail className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your email to generate a password reset link
          </CardDescription>
        </CardHeader>

        {link ? (
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Email delivery is temporarily unavailable. Copy this link and open it in your browser to set a new password. The link expires in 1 hour.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="reset-link">Password reset link for {email}</Label>
              <div className="flex gap-2">
                <Input
                  id="reset-link"
                  readOnly
                  value={link}
                  onFocus={(e) => e.target.select()}
                  className="font-mono text-xs"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setLink(null);
                setEmail("");
              }}
            >
              Generate another link
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Email is temporarily unavailable. The reset link will be shown on this page for you to copy.
                </AlertDescription>
              </Alert>
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
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate Reset Link"}
              </Button>
            </CardFooter>
          </form>
        )}

        <CardFooter className="flex justify-center pt-0 pb-6">
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
