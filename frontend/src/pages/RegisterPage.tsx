import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/layout/AuthShell";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../utils/apiError";
import { maskPhone } from "../utils/phoneMask";
import { getRoleRedirectPath } from "../utils/roleRedirect";
import {
  registerSchema,
  type RegisterFormData,
} from "../validations/authValidation";

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const {
    formState: { dirtyFields, errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RegisterFormData>({
    defaultValues: {
      acceptTerms: false,
    },
    mode: "onTouched",
    resolver: zodResolver(registerSchema),
  });
  const phoneField = register("phone");

  async function onSubmit(data: RegisterFormData) {
    try {
      const user = await registerUser({
        email: data.email,
        name: data.name,
        password: data.password,
        phone: data.phone,
      });
      toast.success("Cadastro criado com sucesso.");
      navigate(getRoleRedirectPath(user.role), { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AuthShell
      description="Agende em segundos. Ganhe pontos. Aproveite benefícios exclusivos."
      eyebrow="Cadastro cliente"
      title="Faça parte da elite"
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          error={errors.name?.message}
          label="Nome completo"
          placeholder="Seu nome"
          success={Boolean(dirtyFields.name && !errors.name)}
          {...register("name")}
        />
        <Input
          error={errors.email?.message}
          label="E-mail"
          placeholder="voce@email.com"
          success={Boolean(dirtyFields.email && !errors.email)}
          type="email"
          {...register("email")}
        />
        <Input
          error={errors.phone?.message}
          label="Telefone"
          placeholder="(82) 8725-0434"
          success={Boolean(dirtyFields.phone && !errors.phone)}
          {...phoneField}
          onChange={(event) => {
            event.target.value = maskPhone(event.target.value);
            phoneField.onChange(event);
          }}
        />
        <Input
          error={errors.password?.message}
          label="Senha"
          placeholder="Mínimo 6 caracteres"
          success={Boolean(dirtyFields.password && !errors.password)}
          type="password"
          {...register("password")}
        />
        <Input
          error={errors.confirmPassword?.message}
          label="Confirmar senha"
          placeholder="Repita sua senha"
          success={Boolean(dirtyFields.confirmPassword && !errors.confirmPassword)}
          type="password"
          {...register("confirmPassword")}
        />

        <label className="flex items-start gap-3 rounded-md border border-white/10 bg-club-black p-3 transition focus-within:border-club-red">
          <input
            className="mt-1 size-4 rounded border-white/20 accent-club-red"
            type="checkbox"
            {...register("acceptTerms")}
          />
          <span className="text-sm leading-6 text-zinc-400">
            Aceito os{" "}
            <Link className="font-semibold text-zinc-200 transition hover:text-white" to="/termos">
              Termos de Uso
            </Link>
            .
            {errors.acceptTerms ? (
              <span className="mt-1 block text-xs font-semibold text-club-red">
                {errors.acceptTerms.message}
              </span>
            ) : null}
          </span>
        </label>

        <Button className="w-full" isLoading={isSubmitting} type="submit">
          <UserPlus className="size-4" aria-hidden="true" />
          Cadastrar
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-500">
        Já tem conta?{" "}
        <Link className="font-semibold text-zinc-300 transition hover:text-white" to="/login">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
