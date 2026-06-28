import { AppError } from "../utils/appError.js";

type WorkingPeriod = {
  endMinutes: number;
  startMinutes: number;
};

const WORKING_HOURS_BY_DAY: Record<number, WorkingPeriod[]> = {
  0: [],
  1: [],
  2: [
    { startMinutes: 9 * 60 + 30, endMinutes: 12 * 60 + 30 },
    { startMinutes: 14 * 60 + 30, endMinutes: 19 * 60 + 30 },
  ],
  3: [
    { startMinutes: 9 * 60 + 30, endMinutes: 12 * 60 + 30 },
    { startMinutes: 14 * 60 + 30, endMinutes: 19 * 60 + 30 },
  ],
  4: [
    { startMinutes: 9 * 60 + 30, endMinutes: 12 * 60 + 30 },
    { startMinutes: 14 * 60 + 30, endMinutes: 19 * 60 + 30 },
  ],
  5: [
    { startMinutes: 9 * 60 + 30, endMinutes: 12 * 60 + 30 },
    { startMinutes: 14 * 60 + 30, endMinutes: 20 * 60 + 30 },
  ],
  6: [
    { startMinutes: 9 * 60 + 30, endMinutes: 12 * 60 + 30 },
    { startMinutes: 14 * 60 + 30, endMinutes: 20 * 60 + 30 },
  ],
};

export const APPOINTMENT_STEP_MINUTES = 30;
export const DEFAULT_UNDEFINED_SERVICE_DURATION_MINUTES = 30;

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function timeToMinutes(value: Date | string) {
  if (value instanceof Date) {
    return value.getUTCHours() * 60 + value.getUTCMinutes();
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getWorkingPeriodsForDate(date: string) {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return WORKING_HOURS_BY_DAY[day] ?? [];
}

export function getServiceDurationMinutes(durationMinutes: number) {
  const baseDuration =
    durationMinutes > 0
      ? durationMinutes
      : DEFAULT_UNDEFINED_SERVICE_DURATION_MINUTES;

  return Math.ceil(baseDuration / APPOINTMENT_STEP_MINUTES) * APPOINTMENT_STEP_MINUTES;
}

export function ensureStartTimeMatchesScheduleStep(startTime: string) {
  if (timeToMinutes(startTime) % APPOINTMENT_STEP_MINUTES !== 0) {
    throw new AppError("O inicio do atendimento deve ser de 30 em 30 minutos.");
  }
}

export function ensureEndTimeMatchesServiceDuration(input: {
  durationMinutes: number;
  endTime: string;
  startTime: string;
}) {
  const expectedEndMinutes = timeToMinutes(input.startTime) + input.durationMinutes;

  if (timeToMinutes(input.endTime) !== expectedEndMinutes) {
    throw new AppError("O horario final precisa respeitar a duracao do servico.");
  }
}

export function ensureWithinWorkingHours(input: {
  date: string;
  endTime: string;
  startTime: string;
}) {
  const periods = getWorkingPeriodsForDate(input.date);
  const startMinutes = timeToMinutes(input.startTime);
  const endMinutes = timeToMinutes(input.endTime);
  const fitsPeriod = periods.some(
    (period) =>
      startMinutes >= period.startMinutes && endMinutes <= period.endMinutes,
  );

  if (!fitsPeriod) {
    throw new AppError("Horario fora do funcionamento da barbearia.");
  }
}
