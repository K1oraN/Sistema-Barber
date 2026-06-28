import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AppointmentStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  RedemptionStatus,
  RewardType,
  Role,
} from "../src/generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL nao configurada.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

const barbershopProfile = {
  address: "Rua da Cordeal, 184, Tabuleiro Martins, Maceió AL, 57081-071, Brasil",
  instagramUrl: "https://www.instagram.com/clubdorafa/reels/?__d=11",
  name: "Club do Rafa",
  phone: "+55 82 8725-0434",
  whatsappUrl: "https://wa.me/558287250434",
  openingHours: [
    { day: "Terça-feira", periods: ["09:30 - 12:30", "14:30 - 19:30"] },
    { day: "Quarta-feira", periods: ["09:30 - 12:30", "14:30 - 19:30"] },
    { day: "Quinta-feira", periods: ["09:30 - 12:30", "14:30 - 19:30"] },
    { day: "Sexta-feira", periods: ["09:30 - 12:30", "14:30 - 20:30"] },
    { day: "Sábado", periods: ["09:30 - 12:30", "14:30 - 20:30"] },
    { day: "Domingo", periods: [] },
    { day: "Segunda-feira", periods: [] },
  ],
};

const realServices = [
  {
    description:
      "Retira levemente as ondulações e o volume natural do cabelo, devolvendo o brilho e a maciez. Manutenção entre 15 e 30 dias.",
    durationLabel: "15 min",
    durationMinutes: 15,
    imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a",
    name: "Alinhamento dos fios",
    price: "50.00",
  },
  {
    description:
      "Alinhamento das linhas da barba e dos fios ou a retirada de todos os fios. Acompanha higienização.",
    durationLabel: "25 min",
    durationMinutes: 25,
    imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1",
    name: "Barba",
    price: "32.00",
  },
  {
    description: "Alinhamento das linhas do bigode e dos fios.",
    durationLabel: "5 min",
    durationMinutes: 5,
    imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f",
    name: "Bigode",
    price: "15.00",
  },
  {
    description:
      "Os aspectos do corte são decididos na hora do atendimento. Acompanha higienização e finalização.",
    durationLabel: "30 min",
    durationMinutes: 30,
    imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a",
    name: "Corte Degradê",
    price: "38.00",
  },
  {
    description:
      "O corte é decidido pelos pais ou responsáveis. Caso haja resistência da criança que leve à não execução do serviço, o valor ainda assim deve ser pago. O valor ficará de crédito para um futuro agendamento.",
    durationLabel: "30 min",
    durationMinutes: 30,
    imageUrl: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186",
    name: "Corte Infantil",
    price: "38.00",
  },
  {
    description:
      "O corte deve ter de base dois números de altura, o disfarce será feito minimamente entre as numerações. Acompanha higienização e finalização.",
    durationLabel: "20 min",
    durationMinutes: 20,
    imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70",
    name: "Corte Máquina",
    price: "28.00",
  },
  {
    description:
      "O corte é feito com máquina e tesoura. Os aspectos do corte são discutidos na hora do atendimento. Acompanha higienização e finalização.",
    durationLabel: "30 min",
    durationMinutes: 30,
    imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f",
    name: "Corte Social",
    price: "38.00",
  },
  {
    description:
      "O corte é todo executado com tesoura. Podendo haver acabamento com máquina. Os aspectos do corte são discutidos na hora do atendimento. Acompanha higienização e finalização.",
    durationLabel: "30 min",
    durationMinutes: 30,
    imageUrl: "https://images.unsplash.com/photo-1521498542256-5aeb47ba2b36",
    name: "Corte Tesoura",
    price: "38.00",
  },
  {
    description: "Depilação com máquina no tórax, costas, peitoral e barriga.",
    durationLabel: "15 min",
    durationMinutes: 15,
    imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033",
    name: "Depilação Corporal com máquina",
    price: "20.00",
  },
  {
    description: "Depilação com cera na parte frontal do nariz.",
    durationLabel: "Sem duração definida",
    durationMinutes: 10,
    imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1",
    name: "Depilação Nasal ou Orelha",
    price: "15.00",
  },
  {
    description: "Consiste em lavar o cabelo e finalizar com escova.",
    durationLabel: "10 min",
    durationMinutes: 10,
    imageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f",
    name: "Higienização + Escova",
    price: "18.00",
  },
  {
    description: "Consiste em lavar o cabelo. Sensação refrescante.",
    durationLabel: "10 min",
    durationMinutes: 10,
    imageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f",
    name: "Higienização Capilar",
    price: "10.00",
  },
  {
    description:
      "É feita a esfoliação da pele, depois é aplicada a máscara para retirada de pequenos pelos e cravos superficiais.",
    durationLabel: "10 min",
    durationMinutes: 10,
    imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033",
    name: "Limpeza de pele",
    price: "30.00",
  },
  {
    description:
      "Com o auxílio de uma toca para luzes, é feita a descoloração dos fios selecionados. Deixando loiro, acinzentado ou platinado. Antes do procedimento é feito um teste de mechas.",
    durationLabel: "1 h",
    durationMinutes: 60,
    imageUrl: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186",
    name: "Luzes",
    price: "120.00",
  },
  {
    description: "Consiste em alinhar o contorno do cabelo. Conhecido como pezinho.",
    durationLabel: "10 min",
    durationMinutes: 10,
    imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a",
    name: "Pezinho",
    price: "15.00",
  },
  {
    description:
      "Consiste em aparar e desenhar com a navalha as linhas da sobrancelha.",
    durationLabel: "5 min",
    durationMinutes: 5,
    imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f",
    name: "Sobrancelha",
    price: "19.00",
  },
];

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function timeOnly(value: string) {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@clubdorafa.com" },
    update: {
      name: "Administrador",
      phone: "+55 82 8725-0434",
      passwordHash,
      role: Role.ADMIN,
      active: true,
    },
    create: {
      name: "Administrador",
      email: "admin@clubdorafa.com",
      phone: "+55 82 8725-0434",
      passwordHash,
      role: Role.ADMIN,
      points: 0,
      level: 1,
      active: true,
    },
  });

  await prisma.barbershopProfile.upsert({
    where: { id: "club-do-rafa" },
    update: barbershopProfile,
    create: {
      id: "club-do-rafa",
      ...barbershopProfile,
    },
  });

  const professionalUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: "rafael@clubdorafa.com" },
      update: {
        name: "Rafael",
        phone: "+55 82 8725-0434",
        passwordHash,
        role: Role.PROFESSIONAL,
        active: true,
      },
      create: {
        name: "Rafael",
        email: "rafael@clubdorafa.com",
        phone: "+55 82 8725-0434",
        passwordHash,
        role: Role.PROFESSIONAL,
        avatarUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033",
        points: 0,
        level: 1,
        active: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "samuca@clubdorafa.com" },
      update: {
        name: "Samuca",
        phone: "+55 82 8725-0434",
        passwordHash,
        role: Role.PROFESSIONAL,
        active: true,
      },
      create: {
        name: "Samuca",
        email: "samuca@clubdorafa.com",
        phone: "+55 82 8725-0434",
        passwordHash,
        role: Role.PROFESSIONAL,
        avatarUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f",
        points: 0,
        level: 1,
        active: true,
      },
    }),
  ]);

  const [rafaProfessional, leoProfessional] = await Promise.all([
    prisma.professional.upsert({
      where: { userId: professionalUsers[0].id },
      update: {
        specialty: "Barbeiro",
        commissionPercent: "50.00",
        online: true,
        active: true,
      },
      create: {
        userId: professionalUsers[0].id,
        specialty: "Barbeiro",
        commissionPercent: "50.00",
        online: true,
        active: true,
      },
    }),
    prisma.professional.upsert({
      where: { userId: professionalUsers[1].id },
      update: {
        specialty: "Barbeiro",
        commissionPercent: "50.00",
        online: true,
        active: true,
      },
      create: {
        userId: professionalUsers[1].id,
        specialty: "Barbeiro",
        commissionPercent: "50.00",
        online: true,
        active: true,
      },
    }),
  ]);

  const clients = await Promise.all([
    prisma.user.upsert({
      where: { email: "andre.martins@email.com" },
      update: {
        name: "Andre Martins",
        phone: "(71) 97777-2001",
        birthDate: dateOnly("1993-05-18"),
        passwordHash,
        role: Role.CLIENT,
        points: 180,
        level: 2,
        active: true,
      },
      create: {
        name: "Andre Martins",
        email: "andre.martins@email.com",
        phone: "(71) 97777-2001",
        birthDate: dateOnly("1993-05-18"),
        passwordHash,
        role: Role.CLIENT,
        points: 180,
        level: 2,
        active: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "felipe.souza@email.com" },
      update: {
        name: "Felipe Souza",
        phone: "(71) 97777-2002",
        birthDate: dateOnly("1989-05-27"),
        passwordHash,
        role: Role.CLIENT,
        points: 320,
        level: 3,
        active: true,
      },
      create: {
        name: "Felipe Souza",
        email: "felipe.souza@email.com",
        phone: "(71) 97777-2002",
        birthDate: dateOnly("1989-05-27"),
        passwordHash,
        role: Role.CLIENT,
        points: 320,
        level: 3,
        active: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "lucas.lima@email.com" },
      update: {
        name: "Lucas Lima",
        phone: "+55 82 99999-9999",
        birthDate: dateOnly("1997-11-04"),
        passwordHash,
        role: Role.CLIENT,
        points: 120,
        level: 1,
        active: true,
      },
      create: {
        name: "Lucas Lima",
        email: "lucas.lima@email.com",
        phone: "+55 82 99999-9999",
        birthDate: dateOnly("1997-11-04"),
        passwordHash,
        role: Role.CLIENT,
        points: 120,
        level: 1,
        active: true,
      },
    }),
  ]);

  const services = await Promise.all(
    realServices.map((service) =>
      prisma.service.upsert({
        where: { name: service.name },
        update: {
          description: service.description,
          durationLabel: service.durationLabel,
          durationMinutes: service.durationMinutes,
          imageUrl: service.imageUrl,
          price: service.price,
          active: true,
        },
        create: {
          ...service,
          active: true,
        },
      }),
    ),
  );

  await prisma.service.updateMany({
    where: {
      name: {
        notIn: realServices.map((service) => service.name),
      },
    },
    data: { active: false },
  });
  const serviceByName = new Map(services.map((service) => [service.name, service]));

  const productSeed = [
    {
      name: "Pomada Modeladora",
      description: "Fixacao forte com acabamento premium.",
      category: "Finalizadores",
      stock: 24,
      costPrice: "18.00",
      price: "39.90",
      allowPreOrder: true,
      imageUrl: "https://images.unsplash.com/photo-1621607512214-68297480165e",
    },
    {
      name: "Gel Fixador",
      description: "Controle e brilho para finalizacao diaria.",
      category: "Finalizadores",
      stock: 14,
      costPrice: "10.00",
      price: "24.90",
      allowPreOrder: true,
      imageUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc",
    },
    {
      name: "Óleo para Barba",
      description: "Hidratacao e brilho para barba.",
      category: "Barba",
      stock: 18,
      costPrice: "16.50",
      price: "34.90",
      allowPreOrder: true,
      imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033",
    },
    {
      name: "Balm para Barba",
      description: "Calmante pos-barba sem alcool.",
      category: "Barba",
      stock: 20,
      costPrice: "14.00",
      price: "32.90",
      allowPreOrder: true,
      imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1",
    },
    {
      name: "Shampoo Masculino",
      description: "Shampoo masculino de uso diario.",
      category: "Cabelo",
      stock: 16,
      costPrice: "22.00",
      price: "49.90",
      allowPreOrder: true,
      imageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f",
    },
    {
      name: "Pente Profissional",
      description: "Pente antiestatico para cabelo e barba.",
      category: "Acessorios",
      stock: 30,
      costPrice: "6.00",
      price: "19.90",
      allowPreOrder: true,
      imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70",
    },
    {
      name: "Máquina de Acabamento",
      description: "Produto sob encomenda para acabamento profissional.",
      category: "Equipamentos",
      stock: 0,
      costPrice: "120.00",
      price: "229.90",
      allowPreOrder: true,
      imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a",
    },
    {
      name: "Navalhete",
      description: "Navalhete profissional para acabamento preciso.",
      category: "Acessorios",
      stock: 8,
      costPrice: "18.00",
      price: "44.90",
      allowPreOrder: true,
      imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033",
    },
  ];

  const products = await Promise.all(
    productSeed.map((product) =>
      prisma.product.upsert({
        where: { name: product.name },
        update: {
          ...product,
          active: true,
          reservedStock: 0,
        },
        create: {
          ...product,
          active: true,
          reservedStock: 0,
        },
      }),
    ),
  );

  await prisma.product.updateMany({
    where: {
      name: {
        notIn: productSeed.map((product) => product.name),
      },
    },
    data: { active: false },
  });

  const productByName = new Map(products.map((product) => [product.name, product]));

  const planSeed = [
    {
      name: "Plano Básico",
      description: "Plano mensal para manter o corte social em dia.",
      price: "49.90",
      highlighted: false,
      benefits: [
        "1 corte social por mes",
        "prioridade em horarios",
        "pontos extras no clube de fidelidade",
      ],
    },
    {
      name: "Plano Premium",
      description: "Plano mensal com corte, barba e vantagens na loja.",
      price: "89.90",
      highlighted: true,
      benefits: [
        "1 corte + barba por mes",
        "prioridade em horarios",
        "pontos em dobro",
        "desconto em produtos",
      ],
    },
    {
      name: "Plano Elite",
      description: "Experiencia completa para cliente frequente do Club do Rafa.",
      price: "129.90",
      highlighted: false,
      benefits: [
        "2 cortes por mes",
        "1 barba por mes",
        "prioridade maxima",
        "pontos em dobro",
        "descontos especiais",
        "brindes exclusivos",
      ],
    },
  ];

  await Promise.all(
    planSeed.map((plan) =>
      prisma.plan.upsert({
        where: { name: plan.name },
        update: {
          ...plan,
          active: true,
        },
        create: {
          ...plan,
          active: true,
        },
      }),
    ),
  );

  await prisma.plan.updateMany({
    where: {
      name: {
        notIn: planSeed.map((plan) => plan.name),
      },
    },
    data: { active: false },
  });

  const rewardSeed = [
    {
      name: "Corte com pontos",
      description: "Credito para usar em um corte social.",
      requiredPoints: 180,
      rewardType: RewardType.SERVICE,
      serviceId: serviceByName.get("Corte Social")?.id,
      productId: null,
      discountValue: null,
      imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a",
    },
    {
      name: "Produto grátis com pontos",
      description: "Resgate uma pomada modeladora para retirada.",
      requiredPoints: 300,
      rewardType: RewardType.PRODUCT,
      serviceId: null,
      productId: productByName.get("Pomada Modeladora")!.id,
      discountValue: null,
      imageUrl: "https://images.unsplash.com/photo-1621607512214-68297480165e",
    },
    {
      name: "Desconto em produto",
      description: "Cupom de desconto para produtos da loja.",
      requiredPoints: 120,
      rewardType: RewardType.DISCOUNT,
      serviceId: null,
      productId: null,
      discountValue: "15.00",
      imageUrl: "https://images.unsplash.com/photo-1607083206968-13611e3d76db",
    },
    {
      name: "Brinde especial",
      description: "Brinde especial separado para retirada.",
      requiredPoints: 220,
      rewardType: RewardType.GIFT,
      serviceId: null,
      productId: productByName.get("Pente Profissional")!.id,
      discountValue: null,
      imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70",
    },
  ];

  const rewards = await Promise.all(
    rewardSeed.map((reward) =>
      prisma.reward.upsert({
        where: { name: reward.name },
        update: {
          ...reward,
          active: true,
        },
        create: {
          ...reward,
          active: true,
        },
      }),
    ),
  );

  await prisma.reward.updateMany({
    where: {
      name: {
        notIn: rewardSeed.map((reward) => reward.name),
      },
    },
    data: { active: false },
  });

  const appointments = await Promise.all([
    prisma.appointment.upsert({
      where: { id: "11111111-1111-4111-8111-111111111111" },
      update: {
        clientId: clients[0].id,
        professionalId: rafaProfessional.id,
        serviceId: serviceByName.get("Corte Degradê")!.id,
        date: dateOnly("2026-05-06"),
        startTime: timeOnly("09:30"),
        endTime: timeOnly("10:00"),
        status: AppointmentStatus.CONFIRMED,
        notes: "Cliente prefere degradê baixo.",
        totalValue: "38.00",
        paymentMethod: PaymentMethod.PIX,
      },
      create: {
        id: "11111111-1111-4111-8111-111111111111",
        clientId: clients[0].id,
        professionalId: rafaProfessional.id,
        serviceId: serviceByName.get("Corte Degradê")!.id,
        date: dateOnly("2026-05-06"),
        startTime: timeOnly("09:30"),
        endTime: timeOnly("10:00"),
        status: AppointmentStatus.CONFIRMED,
        notes: "Cliente prefere degradê baixo.",
        totalValue: "38.00",
        paymentMethod: PaymentMethod.PIX,
      },
    }),
    prisma.appointment.upsert({
      where: { id: "22222222-2222-4222-8222-222222222222" },
      update: {
        clientId: clients[1].id,
        professionalId: leoProfessional.id,
        serviceId: serviceByName.get("Barba")!.id,
        date: dateOnly("2026-05-06"),
        startTime: timeOnly("10:30"),
        endTime: timeOnly("10:55"),
        status: AppointmentStatus.SCHEDULED,
        notes: "Confirmar chegada pelo WhatsApp.",
        totalValue: "32.00",
        paymentMethod: PaymentMethod.CARD,
      },
      create: {
        id: "22222222-2222-4222-8222-222222222222",
        clientId: clients[1].id,
        professionalId: leoProfessional.id,
        serviceId: serviceByName.get("Barba")!.id,
        date: dateOnly("2026-05-06"),
        startTime: timeOnly("10:30"),
        endTime: timeOnly("10:55"),
        status: AppointmentStatus.SCHEDULED,
        notes: "Confirmar chegada pelo WhatsApp.",
        totalValue: "32.00",
        paymentMethod: PaymentMethod.CARD,
      },
    }),
    prisma.appointment.upsert({
      where: { id: "33333333-3333-4333-8333-333333333333" },
      update: {
        clientId: clients[2].id,
        professionalId: rafaProfessional.id,
        serviceId: serviceByName.get("Corte Social")!.id,
        date: dateOnly("2026-05-02"),
        startTime: timeOnly("14:30"),
        endTime: timeOnly("15:00"),
        status: AppointmentStatus.FINISHED,
        notes: "Adicionar pontos de fidelidade.",
        totalValue: "38.00",
        paymentMethod: PaymentMethod.CASH,
      },
      create: {
        id: "33333333-3333-4333-8333-333333333333",
        clientId: clients[2].id,
        professionalId: rafaProfessional.id,
        serviceId: serviceByName.get("Corte Social")!.id,
        date: dateOnly("2026-05-02"),
        startTime: timeOnly("14:30"),
        endTime: timeOnly("15:00"),
        status: AppointmentStatus.FINISHED,
        notes: "Adicionar pontos de fidelidade.",
        totalValue: "38.00",
        paymentMethod: PaymentMethod.CASH,
      },
    }),
  ]);

  await Promise.all([
    prisma.payment.upsert({
      where: { appointmentId: appointments[0].id },
      update: {
        clientId: clients[0].id,
        amount: "38.00",
        method: PaymentMethod.PIX,
        status: PaymentStatus.PAID,
      },
      create: {
        appointmentId: appointments[0].id,
        clientId: clients[0].id,
        amount: "38.00",
        method: PaymentMethod.PIX,
        status: PaymentStatus.PAID,
      },
    }),
    prisma.payment.upsert({
      where: { appointmentId: appointments[1].id },
      update: {
        clientId: clients[1].id,
        amount: "32.00",
        method: PaymentMethod.CARD,
        status: PaymentStatus.PENDING,
      },
      create: {
        appointmentId: appointments[1].id,
        clientId: clients[1].id,
        amount: "32.00",
        method: PaymentMethod.CARD,
        status: PaymentStatus.PENDING,
      },
    }),
    prisma.payment.upsert({
      where: { appointmentId: appointments[2].id },
      update: {
        clientId: clients[2].id,
        amount: "38.00",
        method: PaymentMethod.CASH,
        status: PaymentStatus.PAID,
      },
      create: {
        appointmentId: appointments[2].id,
        clientId: clients[2].id,
        amount: "38.00",
        method: PaymentMethod.CASH,
        status: PaymentStatus.PAID,
      },
    }),
  ]);

  await prisma.rewardRedemption.upsert({
    where: { id: "44444444-4444-4444-8444-444444444444" },
    update: {
      clientId: clients[1].id,
      rewardId: rewards[0].id,
      pointsUsed: 180,
      status: RedemptionStatus.APPROVED,
    },
    create: {
      id: "44444444-4444-4444-8444-444444444444",
      clientId: clients[1].id,
      rewardId: rewards[0].id,
      pointsUsed: 180,
      status: RedemptionStatus.APPROVED,
    },
  });

  console.log("Seed finalizado:", {
    admin: admin.email,
    barbershopProfile: barbershopProfile.name,
    professionals: professionalUsers.length,
    clients: clients.length,
    services: services.length,
    products: products.length,
    plans: planSeed.length,
    rewards: rewards.length,
    appointments: appointments.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
