import { AppError } from "./appError.js";

export function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function timeOnly(value: string) {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

export function dateTimeFromParts(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export function ensureFutureAppointment(date: string, startTime: string) {
  const appointmentDate = dateTimeFromParts(date, startTime);

  if (Number.isNaN(appointmentDate.getTime())) {
    throw new AppError("Data ou horario do agendamento invalido.");
  }

  if (appointmentDate < new Date()) {
    throw new AppError("Nao e permitido agendar em data passada.");
  }
}

