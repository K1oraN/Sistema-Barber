import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  loginSchema,
  type LoginFormData,
} from "../../validations/authValidation";

export function LoginPreviewForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit() {
    toast.success("Frontend pronto para conectar ao backend.");
  }

  return (
    <form
      className="rounded-lg border border-white/10 bg-club-surface p-5 shadow-premium sm:p-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="mb-6">
        <p className="font-display text-2xl font-semibold uppercase">
          Acesso
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Entre com as credenciais da equipe.
        </p>
      </div>

      <Input
        error={errors.email?.message}
        label="E-mail"
        placeholder="rafa@clubdorafa.com"
        type="email"
        {...register("email")}
      />

      <div className="mt-4">
        <Input
          error={errors.password?.message}
          label="Senha"
          placeholder="********"
          type="password"
          {...register("password")}
        />
      </div>

      <Button className="mt-6 w-full" isLoading={isSubmitting} type="submit">
        <LogIn className="size-4" aria-hidden="true" />
        Entrar
      </Button>
    </form>
  );
}
