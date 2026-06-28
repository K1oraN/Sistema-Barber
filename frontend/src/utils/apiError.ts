import axios from "axios";

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? "Nao foi possivel concluir a acao.";
  }

  return "Nao foi possivel concluir a acao.";
}

