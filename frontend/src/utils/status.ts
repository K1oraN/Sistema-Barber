import type {
  Appointment,
  ClientPlan,
  Payment,
  ProductOrder,
} from "../types/domain";

export const appointmentStatusLabels: Record<Appointment["status"], string> = {
  CANCELED: "Cancelado",
  CONFIRMED: "Confirmado",
  FINISHED: "Finalizado",
  SCHEDULED: "Agendado",
};

export const paymentStatusLabels: Record<Payment["status"], string> = {
  AWAITING_CONFIRMATION: "Aguardando confirmação",
  CANCELED: "Cancelado",
  PAID: "Pago",
  PENDING: "Pendente",
};

export const clientPlanStatusLabels: Record<ClientPlan["status"], string> = {
  ACTIVE: "Ativo",
  CANCELED: "Cancelado",
  EXPIRED: "Vencido",
  PENDING: "Aguardando confirmacao",
};

export const productOrderStatusLabels: Record<ProductOrder["status"], string> = {
  AVAILABLE_FOR_PICKUP: "Disponivel para retirada",
  CANCELED: "Cancelado",
  DELIVERED: "Entregue",
  ORDERED: "Encomendado",
  PRE_ORDER_REQUESTED: "Encomenda solicitada",
  RESERVED: "Reservado",
  UNDER_REVIEW: "Em analise",
};

export const productOrderTypeLabels: Record<ProductOrder["orderType"], string> = {
  PRE_ORDER: "Encomenda",
  RESERVATION: "Reserva",
};

export function getAppointmentStatusTone(status: Appointment["status"]) {
  if (status === "SCHEDULED") {
    return "amber";
  }

  if (status === "CONFIRMED") {
    return "blue";
  }

  if (status === "CANCELED") {
    return "red";
  }

  return "green";
}

export function getPaymentStatusTone(status: Payment["status"]) {
  if (status === "PENDING") {
    return "amber";
  }

  if (status === "AWAITING_CONFIRMATION") {
    return "blue";
  }

  if (status === "CANCELED") {
    return "red";
  }

  return "green";
}

export function getClientPlanStatusTone(status: ClientPlan["status"]) {
  if (status === "PENDING") {
    return "blue";
  }

  if (status === "CANCELED" || status === "EXPIRED") {
    return "red";
  }

  return "green";
}

export function getProductOrderStatusTone(status: ProductOrder["status"]) {
  if (status === "RESERVED" || status === "PRE_ORDER_REQUESTED") {
    return "amber";
  }

  if (status === "UNDER_REVIEW" || status === "ORDERED") {
    return "blue";
  }

  if (status === "CANCELED") {
    return "red";
  }

  return "green";
}
