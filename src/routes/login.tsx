import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { redirectParaMeuPerfil } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — NoCode Folio" }] }),
  component: LoginPage,
});

type AuthMode = "signup" | "login";

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      void redirectParaMeuPerfil(navigate, user);
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    setMagicSent(false);
  }, [mode]);

  const sendMagicLink = async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
          shouldCreateUser: mode === "signup",
        },
      });
      if (error) {
        if (mode === "login" && isUsuarioNaoEncontrado(error.message)) {
          toast.error('Este email não tem conta. Use a aba "Criar conta".');
          return;
        }
        throw error;
      }
      setMagicSent(true);
      toast.success(
        mode === "signup"
          ? "Link enviado! Confirme seu email para ativar a conta."
          : "Link de acesso enviado! Verifique seu email.",
      );
    } catch (e) {
      toast.error(formatAuthError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const submitEmailPassword = async () => {
    if (!email.trim() || !password) {
      toast.error("Preencha email e senha.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email ou entre com a senha.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          if (isUsuarioNaoEncontrado(error.message)) {
            toast.error('Conta não encontrada. Crie uma conta na aba "Criar conta".');
            return;
          }
          throw error;
        }
      }
    } catch (e) {
      toast.error(formatAuthError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 grid place-items-center shadow-lg shadow-violet-500/40">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">
            NoCode<span className="text-violet-400"> Folio</span>
          </span>
        </Link>

        <div className="glass p-6 sm:p-8 rounded-3xl bg-slate-900/40 backdrop-blur-md border border-slate-800">
          <h1 className="text-2xl font-bold text-center">Seu portfólio em bento</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Crie uma conta para começar. Depois use Entrar com o mesmo email.
          </p>

          <Tabs value={mode} onValueChange={(v) => setMode(v as AuthMode)} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
              <TabsTrigger value="login">Entrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <AuthFields
                email={email}
                password={password}
                magicSent={magicSent}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
              />
              <Button
                onClick={() => void submitEmailPassword()}
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600"
              >
                {submitting ? "Aguarde…" : "Criar conta com email e senha"}
              </Button>
              <Divider label="ou Magic Link" />
              <Button
                onClick={() => void sendMagicLink()}
                disabled={submitting || !email.trim() || magicSent}
                variant="secondary"
                className="w-full rounded-xl"
              >
                {magicSent ? "Link enviado" : "Criar conta com Magic Link"}
              </Button>
            </TabsContent>

            <TabsContent value="login" className="space-y-4 mt-4">
              <p className="text-xs text-muted-foreground text-center">
                Use o email e a senha da conta que você criou.
              </p>
              <AuthFields
                email={email}
                password={password}
                magicSent={magicSent}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
              />
              <Button
                onClick={() => void submitEmailPassword()}
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600"
              >
                {submitting ? "Aguarde…" : "Entrar com email e senha"}
              </Button>
              <Divider label="ou Magic Link" />
              <Button
                onClick={() => void sendMagicLink()}
                disabled={submitting || !email.trim() || magicSent}
                variant="secondary"
                className="w-full rounded-xl"
              >
                {magicSent ? "Link enviado" : "Entrar com Magic Link"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Não tem conta?{" "}
                <button
                  type="button"
                  className="text-violet-400 hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Criar conta
                </button>
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function AuthFields({
  email,
  password,
  magicSent,
  onEmailChange,
  onPasswordChange,
}: {
  email: string;
  password: string;
  magicSent: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="voce@email.com"
          disabled={magicSent}
          autoComplete="email"
        />
      </div>
      <div>
        <Label>Senha</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="mínimo 6 caracteres"
          disabled={magicSent}
          autoComplete={magicSent ? "off" : "current-password"}
        />
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px bg-border flex-1" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="h-px bg-border flex-1" />
    </div>
  );
}

function isUsuarioNaoEncontrado(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("user not found") ||
    m.includes("signups not allowed") ||
    m.includes("not registered") ||
    m.includes("invalid login") ||
    m.includes("invalid credentials")
  );
}

function formatAuthError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "Erro de autenticação";
  if (msg.toLowerCase().includes("provider is not enabled")) {
    return "Provedor de login não habilitado no Supabase. Use email e senha ou Magic Link.";
  }
  return msg;
}
