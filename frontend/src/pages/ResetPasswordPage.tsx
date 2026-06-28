import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { AuthShell } from "../components/layout/AuthShell";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "../validations/authValidation";

export function ResetPasswordPage() {
  const {
    formState: { dirtyFields, errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ResetPasswordFormData>({
    mode: "onTouched",
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit() {
    toast.success(
      "Se o email existir, enviaremos instruções para redefinir sua senha.",
    );
  }

  return (
    <AuthShell
      description="Informe seu e-mail para receber as instruções de recuperação."
      eyebrow="Acesso"
      title="Recuperar senha"
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
        <Button className="w-full" isLoading={isSubmitting} type="submit">
          <Mail className="size-4" aria-hidden="true" />
          Enviar instruções
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-500">
        Lembrou sua senha?{" "}
        <Link className="font-semibold text-zinc-300 transition hover:text-white" to="/login">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
