import type { Service } from "../types/domain";

export const BARBERSHOP_CONTACT = {
  address: "Rua da Cordeal, 184, Tabuleiro Martins, Maceió AL, 57081-071, Brasil",
  displayPhone: "+55 82 8725-0434",
  instagramUrl: "https://www.instagram.com/clubdorafa/reels/?__d=11",
  name: "Club do Rafa",
  whatsappUrl: "https://wa.me/558287250434",
};

export const OPENING_HOURS = [
  {
    day: "Segunda-feira",
    periods: [],
  },
  {
    day: "Terça-feira",
    periods: ["09:30 - 12:30", "14:30 - 19:30"],
  },
  {
    day: "Quarta-feira",
    periods: ["09:30 - 12:30", "14:30 - 19:30"],
  },
  {
    day: "Quinta-feira",
    periods: ["09:30 - 12:30", "14:30 - 19:30"],
  },
  {
    day: "Sexta-feira",
    periods: ["09:30 - 12:30", "14:30 - 20:30"],
  },
  {
    day: "Sábado",
    periods: ["09:30 - 12:30", "14:30 - 20:30"],
  },
  {
    day: "Domingo",
    periods: [],
  },
];

export const TEAM_MEMBERS = [
  {
    description:
      "Especialista em cortes masculinos, degradê, barba e acabamento premium.",
    image:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=700&q=80",
    name: "Rafael",
    specialty: "Barbeiro",
    status: "Agenda aberta",
  },
  {
    description:
      "Atendimento profissional com foco em corte, barba, sobrancelha e finalização.",
    image:
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=700&q=80",
    name: "Samuca",
    specialty: "Barbeiro",
    status: "Agenda aberta",
  },
];

export const REAL_SERVICES = [
  {
    description:
      "Retira levemente as ondulações e o volume natural do cabelo, devolvendo o brilho e a maciez. Manutenção entre 15 e 30 dias.",
    durationLabel: "15 min",
    durationMinutes: 15,
    name: "Alinhamento dos fios",
    price: "R$ 50,00",
  },
  {
    description:
      "Alinhamento das linhas da barba e dos fios ou a retirada de todos os fios. Acompanha higienização.",
    durationLabel: "25 min",
    durationMinutes: 25,
    name: "Barba",
    price: "R$ 32,00",
  },
  {
    description: "Alinhamento das linhas do bigode e dos fios.",
    durationLabel: "5 min",
    durationMinutes: 5,
    name: "Bigode",
    price: "R$ 15,00",
  },
  {
    description:
      "Os aspectos do corte são decididos na hora do atendimento. Acompanha higienização e finalização.",
    durationLabel: "30 min",
    durationMinutes: 30,
    name: "Corte Degradê",
    price: "R$ 38,00",
  },
  {
    description:
      "O corte é decidido pelos pais ou responsáveis. Caso haja resistência da criança que leve à não execução do serviço, o valor ainda assim deve ser pago. O valor ficará de crédito para um futuro agendamento.",
    durationLabel: "30 min",
    durationMinutes: 30,
    name: "Corte Infantil",
    price: "R$ 38,00",
  },
  {
    description:
      "O corte deve ter de base dois números de altura, o disfarce será feito minimamente entre as numerações. Acompanha higienização e finalização.",
    durationLabel: "20 min",
    durationMinutes: 20,
    name: "Corte Máquina",
    price: "R$ 28,00",
  },
  {
    description:
      "O corte é feito com máquina e tesoura. Os aspectos do corte são discutidos na hora do atendimento. Acompanha higienização e finalização.",
    durationLabel: "30 min",
    durationMinutes: 30,
    name: "Corte Social",
    price: "R$ 38,00",
  },
  {
    description:
      "O corte é todo executado com tesoura. Podendo haver acabamento com máquina. Os aspectos do corte são discutidos na hora do atendimento. Acompanha higienização e finalização.",
    durationLabel: "30 min",
    durationMinutes: 30,
    name: "Corte Tesoura",
    price: "R$ 38,00",
  },
  {
    description: "Depilação com máquina no tórax, costas, peitoral e barriga.",
    durationLabel: "15 min",
    durationMinutes: 15,
    name: "Depilação Corporal com máquina",
    price: "R$ 20,00",
  },
  {
    description: "Depilação com cera na parte frontal do nariz.",
    durationLabel: "Sem duração definida",
    durationMinutes: 10,
    name: "Depilação Nasal ou Orelha",
    price: "R$ 15,00",
  },
  {
    description: "Consiste em lavar o cabelo e finalizar com escova.",
    durationLabel: "10 min",
    durationMinutes: 10,
    name: "Higienização + Escova",
    price: "R$ 18,00",
  },
  {
    description: "Consiste em lavar o cabelo. Sensação refrescante.",
    durationLabel: "10 min",
    durationMinutes: 10,
    name: "Higienização Capilar",
    price: "R$ 10,00",
  },
  {
    description:
      "É feita a esfoliação da pele, depois é aplicada a máscara para retirada de pequenos pelos e cravos superficiais.",
    durationLabel: "10 min",
    durationMinutes: 10,
    name: "Limpeza de pele",
    price: "R$ 30,00",
  },
  {
    description:
      "Com o auxílio de uma toca para luzes, é feita a descoloração dos fios selecionados. Deixando loiro, acinzentado ou platinado. Antes do procedimento é feito um teste de mechas.",
    durationLabel: "1 h",
    durationMinutes: 60,
    name: "Luzes",
    price: "R$ 120,00",
  },
  {
    description: "Consiste em alinhar o contorno do cabelo. Conhecido como pezinho.",
    durationLabel: "10 min",
    durationMinutes: 10,
    name: "Pezinho",
    price: "R$ 15,00",
  },
  {
    description:
      "Consiste em aparar e desenhar com a navalha as linhas da sobrancelha.",
    durationLabel: "5 min",
    durationMinutes: 5,
    name: "Sobrancelha",
    price: "R$ 19,00",
  },
];

export function formatOpeningPeriods(periods: string[]) {
  return periods.length ? periods.join(" / ") : "Fechada";
}

export function getServiceDurationLabel(
  service: Pick<Service, "durationLabel" | "durationMinutes">,
) {
  return service.durationLabel?.trim() || `${service.durationMinutes} min`;
}
