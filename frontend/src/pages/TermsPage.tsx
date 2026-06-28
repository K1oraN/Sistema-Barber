import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";

const sections = [
  {
    title: "1. Uso da plataforma",
    text: "O sistema Club do Rafa organiza cadastro, agendamentos, pagamentos, pontos e comunicação relacionada aos serviços da barbearia.",
  },
  {
    title: "2. Cadastro e segurança",
    text: "O usuário deve informar dados verdadeiros e manter suas credenciais em segurança. A conta é pessoal e não deve ser compartilhada.",
  },
  {
    title: "3. Agendamentos",
    text: "Horários estão sujeitos à disponibilidade da equipe. Cancelamentos e alterações podem seguir regras operacionais da barbearia.",
  },
  {
    title: "4. Pagamentos",
    text: "Valores, métodos de pagamento e confirmação podem variar conforme serviço contratado, promoções e validação administrativa.",
  },
  {
    title: "5. Clube de pontos",
    text: "Pontos e prêmios podem ser ajustados conforme campanhas, disponibilidade, validade e critérios internos do Club do Rafa.",
  },
];

export function TermsPage() {
  return (
    <section className="bg-[radial-gradient(circle_at_top_right,rgba(217,4,41,0.12),transparent_28rem)] px-5 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <PageHeader
          eyebrow="Documento"
          title="Termos de Uso"
          description="Leia os principais pontos sobre cadastro, agendamentos, pagamentos e benefícios."
          actions={
            <Link to="/cadastro">
              <Button type="button" variant="secondary">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Voltar ao cadastro
              </Button>
            </Link>
          }
        />

        <Card>
          <CardContent className="space-y-5">
            {sections.map((section) => (
              <article
                className="rounded-md border border-white/10 bg-club-black p-5"
                key={section.title}
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-club-red/10 text-club-red">
                    <FileText className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-display text-2xl font-semibold uppercase text-white">
                      {section.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-zinc-500">
                      {section.text}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            <div className="flex items-start gap-3 rounded-md border border-club-red/20 bg-club-red/10 p-5 text-sm leading-6 text-red-100">
              <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p>
                Ao criar uma conta, você declara estar de acordo com estes
                termos e com o uso dos dados necessários para funcionamento dos
                serviços digitais da barbearia.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
