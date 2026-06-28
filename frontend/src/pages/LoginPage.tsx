import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/layout/AuthShell";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../utils/apiError";
import { getRoleRedirectPath } from "../utils/roleRedirect";
import {
  loginSchema,
  type LoginFormData,
} from "../validations/authValidation";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    formState: { dirtyFields, errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormData>({
    mode: "onTouched",
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    try {
      const user = await login(data);
      toast.success("Login realizado com sucesso.");
      const from = (location.state as { from?: { pathname?: string } } | null)?.from
        ?.pathname;
      navigate(from ?? getRoleRedirectPath(user.role), { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AuthShell
      description="Acesse sua conta para gerenciar seus agendamentos e pontos."
      eyebrow="Acesso seguro"
      title="Bem-vindo de volta"
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          error={errors.email?.message}
          label="E-mail"
          placeholder="voce@email.com"
          success={Boolean(dirtyFields.email && !errors.email)}
          type="email"
          {...register("email")}
        />
        <Input
          error={errors.password?.message}
          label="Senha"
          placeholder="******"
          success={Boolean(dirtyFields.password && !errors.password)}
          type="password"
          {...register("password")}
        />

        <div className="flex justify-end">
          <Link
            className="text-sm font-semibold text-zinc-400 transition hover:text-white"
            to="/redefinir-senha"
          >
            Esqueci minha senha
          </Link>
        </div>

        <Button className="w-full" isLoading={isSubmitting} type="submit">
          <LogIn className="size-4" aria-hidden="true" />
          Entrar
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-500">
        Ainda não tem conta?{" "}
        <Link className="font-semibold text-zinc-300 transition hover:text-white" to="/cadastro">
          Criar cadastro
        </Link>
      </p>
    </AuthShell>
  );
}
