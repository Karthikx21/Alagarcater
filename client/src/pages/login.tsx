import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User } from "lucide-react";
import cateringLogo from "@/assets/catering_logo.png";

export default function LoginPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    if (!username || !password) {
      setError(t("login.errorEmptyFields"));
      return;
    }

    const success = await login(username, password);
    if (success) {
      setLocation("/");
    } else {
      setError(t("login.errorInvalidCredentials") || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary-light/20 to-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col items-center">
        <img
          src={cateringLogo}
          alt={t("common.logoAlt")}
          className="h-24 w-24 mb-4"
        />
        <h1 className="text-3xl font-bold text-primary">{t("common.companyName")}</h1>
        <p className="text-muted-foreground mt-1 font-tamil">{t("common.companyNameTamil")}</p>
      </div>
      
      <Card className="w-full max-w-md shadow-lg border-2 border-primary/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t("login.title")}</CardTitle>
          <CardDescription className="text-center">
            {t("login.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">{t("login.username")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder={t("login.usernamePlaceholder")}
                  className="pl-10 border-input/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder={t("login.passwordPlaceholder")}
                  className="pl-10 border-input/50"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t("login.signingIn") : t("login.signIn")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {t("login.contactAdmin")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}