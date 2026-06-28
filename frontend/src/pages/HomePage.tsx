import {
  CalendarCheck,
  Camera,
  Clock3,
  Gift,
  MapPin,
  MessageCircle,
  Scissors,
  ShieldCheck,
  Star,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import {
  BARBERSHOP_CONTACT,
  OPENING_HOURS,
  REAL_SERVICES,
  TEAM_MEMBERS,
  formatOpeningPeriods,
} from "../constants/barbershop";

const heroImage =
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=2200&q=85";

const differentials = [
  {
    description: "Recepção cuidadosa, ambiente elegante e atendimento pensado nos detalhes.",
    icon: Star,
    title: "Atendimento premium",
  },
  {
    description: "Técnica, acabamento e leitura de estilo para cada tipo de cabelo e barba.",
    icon: UsersRound,
    title: "Profissionais experientes",
  },
  {
    description: "Cada visita soma vantagens para trocar por descontos e experiências.",
    icon: Gift,
    title: "Clube de pontos",
  },
  {
    description: "Escolha serviço, horário e profissional sem perder tempo no telefone.",
    icon: CalendarCheck,
    title: "Agendamento online",
  },
];

const galleryImages = [
  {
    alt: "Barbeiro finalizando corte masculino com máquina",
    src: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=80",
  },
  {
    alt: "Cadeira de barbearia em ambiente escuro",
    src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80",
  },
  {
    alt: "Corte masculino sendo aparado com tesoura",
    src: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=900&q=80",
  },
  {
    alt: "Bancada de barbearia com espelho e cadeira",
    src: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80",
  },
  {
    alt: "Profissional preparando atendimento de barbearia",
    src: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=80",
  },
  {
    alt: "Detalhe de corte masculino e acabamento",
    src: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=900&q=80",
  },
];

export function HomePage() {
  return (
    <>
      <section
        className="relative flex min-h-[calc(100vh-5rem)] overflow-hidden"
        id="inicio"
      >
        <img
          alt="Interior premium de barbearia"
          className="absolute inset-0 h-full w-full object-cover"
          src={heroImage}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/82 to-black/35" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,11,0.18),rgba(11,11,11,0.88))]" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center px-5 py-14 sm:px-8">
          <div className="max-w-4xl animate-slide-up">
            <Badge tone="red">Desde 2015</Badge>
            <h1 className="mt-7 max-w-4xl font-display text-6xl font-bold uppercase leading-[0.95] text-white sm:text-7xl lg:text-8xl">
              VISUAL QUE{" "}
              <span className="bg-gradient-to-r from-club-red via-red-500 to-white bg-clip-text text-transparent">
                IMPÕE RESPEITO
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-xl">
              Cortes modernos, atendimento premium e uma experiência feita para
              quem valoriza estilo.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/cadastro">
                <Button className="w-full sm:w-auto" size="lg" type="button">
                  Agendar agora
                </Button>
              </Link>
              <a href="#servicos">
                <Button className="w-full sm:w-auto" size="lg" type="button" variant="secondary">
                  Conhecer serviços
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative z-10 -mt-10 border-y border-white/10 bg-club-black py-16"
        id="sobre"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="inline-flex rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase text-zinc-300">
              Sobre
            </span>
            <h2 className="mt-5 font-display text-4xl font-semibold uppercase text-white sm:text-5xl">
              Barbearia com presença, técnica e conforto.
            </h2>
            <p className="mt-5 text-sm leading-7 text-zinc-400 sm:text-base">
              O Club do Rafa nasceu para unir acabamento impecável, ambiente
              premium e uma rotina simples para quem quer estar sempre no
              melhor visual. Aqui, cada atendimento começa no estilo do cliente
              e termina no detalhe que faz diferença.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {differentials.map((item) => (
              <Card className="transition hover:-translate-y-1 hover:border-club-red/40" key={item.title}>
                <CardContent>
                  <item.icon className="size-6 text-club-red" aria-hidden="true" />
                  <h3 className="mt-5 font-display text-2xl font-semibold uppercase text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b0b0b] py-20" id="servicos">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase text-zinc-300">
                Serviços
              </span>
              <h2 className="mt-5 font-display text-4xl font-semibold uppercase text-white sm:text-5xl">
                O corte certo para cada momento.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-zinc-500">
              Serviços reais do Club do Rafa, com valores e durações usados no
              agendamento online.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {REAL_SERVICES.map((service) => (
              <Card className="transition hover:-translate-y-1 hover:border-club-red/50" key={service.name}>
                <CardContent className="flex h-full flex-col">
                  <Scissors className="size-6 text-club-red" aria-hidden="true" />
                  <h3 className="mt-5 font-display text-2xl font-semibold uppercase text-white">
                    {service.name}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-zinc-500">
                    {service.description}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <strong className="font-display text-3xl font-semibold text-white">
                      {service.price}
                    </strong>
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-zinc-500">
                      <Clock3 className="size-4 text-club-red" aria-hidden="true" />
                      {service.durationLabel}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-club-surface py-20" id="galeria">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="mb-10">
            <span className="inline-flex rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase text-zinc-300">
              Galeria
            </span>
            <h2 className="mt-5 font-display text-4xl font-semibold uppercase text-white sm:text-5xl">
              Cortes, detalhes e atmosfera.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((image, index) => (
              <div
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-club-black"
                key={image.src}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-club-black px-5 text-center text-sm font-bold uppercase text-zinc-500">
                  Imagem indisponível
                </div>
                <img
                  alt={image.alt}
                  className="relative z-10 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  src={image.src}
                />
                <div className="absolute inset-0 z-20 bg-black/0 transition duration-300 group-hover:bg-black/55" />
                <div className="absolute inset-x-0 bottom-0 z-30 translate-y-full p-4 transition duration-300 group-hover:translate-y-0">
                  <span className="font-display text-2xl font-semibold uppercase text-white">
                    Club do Rafa {index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b0b0b] py-20" id="equipe">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase text-zinc-300">
                Equipe
              </span>
              <h2 className="mt-5 font-display text-4xl font-semibold uppercase text-white sm:text-5xl">
                Profissionais que seguram o padrão.
              </h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {TEAM_MEMBERS.map((member) => (
              <Card className="overflow-hidden transition hover:-translate-y-1 hover:border-club-red/50" key={member.name}>
                <div className="aspect-[4/3] overflow-hidden bg-club-black">
                  <img
                    alt={member.name}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    src={member.image}
                  />
                </div>
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-3xl font-semibold uppercase text-white">
                        {member.name}
                      </h3>
                      <p className="mt-2 text-sm font-bold uppercase text-club-red">
                        {member.specialty}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-zinc-500">
                        {member.description}
                      </p>
                    </div>
                    <span className="mt-1 size-3 rounded-full bg-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.65)]" />
                  </div>
                  <Badge className="mt-5" tone="green">
                    {member.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-club-surface py-20" id="contato">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="inline-flex rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase text-zinc-300">
              Contato
            </span>
            <h2 className="mt-5 font-display text-4xl font-semibold uppercase text-white sm:text-5xl">
              Endereço, agenda e redes oficiais.
            </h2>
            <p className="mt-5 text-sm leading-7 text-zinc-400">
              Fale com a barbearia pelo WhatsApp ou acompanhe os conteúdos no
              Instagram do Club do Rafa.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href={BARBERSHOP_CONTACT.whatsappUrl} rel="noreferrer" target="_blank">
                <Button className="w-full sm:w-auto" type="button">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp
                </Button>
              </a>
              <a href={BARBERSHOP_CONTACT.instagramUrl} rel="noreferrer" target="_blank">
                <Button className="w-full sm:w-auto" type="button" variant="secondary">
                  <Camera className="size-4" aria-hidden="true" />
                  Instagram
                </Button>
              </a>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent>
                <MessageCircle className="size-6 text-club-red" aria-hidden="true" />
                <h3 className="mt-4 font-display text-2xl font-semibold uppercase text-white">
                  WhatsApp
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {BARBERSHOP_CONTACT.displayPhone}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <MapPin className="size-6 text-club-red" aria-hidden="true" />
                <h3 className="mt-4 font-display text-2xl font-semibold uppercase text-white">
                  Endereço
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {BARBERSHOP_CONTACT.address}
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent>
                <Clock3 className="size-6 text-club-red" aria-hidden="true" />
                <h3 className="mt-4 font-display text-2xl font-semibold uppercase text-white">
                  Horário de funcionamento
                </h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {OPENING_HOURS.map((item) => (
                    <div
                      className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-club-black px-4 py-3 text-sm"
                      key={item.day}
                    >
                      <span className="font-bold text-zinc-300">{item.day}</span>
                      <span className="text-right font-semibold text-zinc-500">
                        {formatOpeningPeriods(item.periods)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-[#0b0b0b] py-20">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex rounded-md border border-club-red/30 bg-club-red/10 px-4 py-2 text-xs font-bold uppercase text-red-100">
              Hora de mudar o visual
            </span>
            <h2 className="mt-5 max-w-3xl font-display text-4xl font-semibold uppercase text-white sm:text-6xl">
              Crie sua conta e garanta seu próximo horário.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400">
              Agende online, acompanhe pagamentos e acumule pontos para trocar
              por benefícios.
            </p>
          </div>
          <Link to="/cadastro">
            <Button className="w-full sm:w-auto" size="lg" type="button">
              Criar conta
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-club-black py-12">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:px-8 md:grid-cols-[1.2fr_0.9fr_0.9fr_0.7fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg border border-white/10 bg-club-surface">
                <Scissors className="size-5 text-club-red" aria-hidden="true" />
              </div>
              <p className="font-display text-2xl font-semibold uppercase leading-none text-white">
                CLUB DO <span className="text-club-red">RAFA</span>
              </p>
            </div>
            <p className="mt-5 max-w-md text-sm leading-6 text-zinc-500">
              Barbearia premium para quem valoriza estilo, atendimento e
              acabamento de respeito.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                aria-label="Instagram"
                className="flex size-10 items-center justify-center rounded-md border border-white/10 text-zinc-300 transition hover:border-club-red/50 hover:text-white"
                href={BARBERSHOP_CONTACT.instagramUrl}
                rel="noreferrer"
                target="_blank"
              >
                <Camera className="size-5" aria-hidden="true" />
              </a>
              <a
                aria-label="WhatsApp"
                className="flex size-10 items-center justify-center rounded-md border border-white/10 text-zinc-300 transition hover:border-club-red/50 hover:text-white"
                href={BARBERSHOP_CONTACT.whatsappUrl}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle className="size-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display text-2xl font-semibold uppercase text-white">
              Contato
            </h3>
            <div className="mt-5 space-y-3 text-sm text-zinc-500">
              <p className="flex items-center gap-2">
                <MessageCircle className="size-4 text-club-red" aria-hidden="true" />
                {BARBERSHOP_CONTACT.displayPhone}
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 text-club-red" aria-hidden="true" />
                {BARBERSHOP_CONTACT.address}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-display text-2xl font-semibold uppercase text-white">
              Horários
            </h3>
            <div className="mt-5 grid gap-2 text-sm text-zinc-500">
              {OPENING_HOURS.map((item) => (
                <p className="flex justify-between gap-4" key={item.day}>
                  <span>{item.day.replace("-feira", "")}</span>
                  <span className="text-right">{formatOpeningPeriods(item.periods)}</span>
                </p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-2xl font-semibold uppercase text-white">
              Links úteis
            </h3>
            <div className="mt-5 grid gap-3 text-sm font-semibold text-zinc-500">
              <Link className="transition hover:text-white" to="/login">
                Entrar
              </Link>
              <Link className="transition hover:text-white" to="/cadastro">
                Criar conta
              </Link>
              <Link className="transition hover:text-white" to="/termos">
                Termos
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-7xl flex-col gap-3 border-t border-white/10 px-5 pt-6 text-xs font-semibold uppercase text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>Copyright 2026 Club do Rafa</span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-club-red" aria-hidden="true" />
            Sistema premium de barbearia
          </span>
        </div>
      </footer>
    </>
  );
}
