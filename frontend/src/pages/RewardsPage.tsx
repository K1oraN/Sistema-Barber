import { ArrowLeft, Gift, Package, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Loading } from "../components/ui/Loading";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import type { Reward } from "../types/domain";
import { getApiErrorMessage } from "../utils/apiError";

export function RewardsPage() {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);

  const loadRewards = useCallback(async () => {
    try {
      const { data } = await api.get<Reward[]>("/rewards?active=true");
      setRewards(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  async function redeemReward(rewardId: string) {
    try {
      setRedeemingId(rewardId);
      await api.post("/reward-redemptions", { rewardId });
      await Promise.all([refreshUser(), loadRewards()]);
      toast.success("Prêmio resgatado com sucesso.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRedeemingId(null);
    }
  }

  if (loading) {
    return <Loading label="Carregando prêmios" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate("/cliente")} size="sm" type="button" variant="secondary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar
          </Button>
          <div>
            <h1 className="font-display text-4xl font-semibold uppercase text-white">
              Prêmios
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Resgate benefícios usando seus pontos.
            </p>
          </div>
        </div>
        <Badge tone="red">{user?.points ?? 0} pontos atuais</Badge>
      </div>

      {rewards.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => {
            const canRedeem = (user?.points ?? 0) >= reward.requiredPoints;
            const productAvailable =
              reward.product && reward.product.stock - reward.product.reservedStock > 0;
            const productUnavailable =
              (reward.rewardType === "PRODUCT" || reward.rewardType === "GIFT") &&
              reward.product &&
              !productAvailable &&
              !reward.product.allowPreOrder;
            const canRequestProduct =
              !productUnavailable &&
              (reward.rewardType !== "PRODUCT" && reward.rewardType !== "GIFT"
                ? true
                : Boolean(reward.product));

            return (
              <Card
                className="overflow-hidden transition hover:-translate-y-1 hover:border-club-red/40"
                key={reward.id}
              >
                <div className="relative flex h-40 items-center justify-center overflow-hidden bg-club-black">
                  {reward.imageUrl ? (
                    <img
                      alt={reward.name}
                      className="h-full w-full object-cover opacity-75"
                      src={reward.imageUrl}
                    />
                  ) : (
                    <Sparkles className="size-16 text-club-red" aria-hidden="true" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <Badge className="absolute bottom-4 left-4" tone={canRedeem ? "green" : "zinc"}>
                    {reward.requiredPoints} pontos
                  </Badge>
                  <Badge className="absolute right-4 top-4" tone="red">
                    {rewardTypeLabel(reward)}
                  </Badge>
                </div>
                <CardContent>
                  <h2 className="font-display text-3xl font-semibold uppercase text-white">
                    {reward.name}
                  </h2>
                  <p className="mt-3 min-h-14 text-sm leading-6 text-zinc-500">
                    {reward.description}
                  </p>
                  {productUnavailable ? (
                    <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-sm font-semibold text-amber-100">
                      <Package className="size-4" aria-hidden="true" />
                      Produto indisponivel no momento.
                    </div>
                  ) : null}
                  {canRedeem && canRequestProduct ? (
                    <Button
                      className="mt-5 w-full"
                      isLoading={redeemingId === reward.id}
                      onClick={() => redeemReward(reward.id)}
                      type="button"
                    >
                      Resgatar
                    </Button>
                  ) : (
                    <div className="mt-5">
                      <Button className="w-full" disabled type="button">
                        Resgatar
                      </Button>
                      <p className="mt-2 text-center text-xs font-semibold text-zinc-500">
                        {canRedeem ? "Indisponivel para resgate" : "Pontos insuficientes"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          description="Novos prêmios aparecem aqui quando estiverem ativos."
          icon={Gift}
          title="Sem prêmios"
        />
      )}
    </div>
  );
}

function rewardTypeLabel(reward: Reward) {
  const labels: Record<Reward["rewardType"], string> = {
    DISCOUNT: "Desconto",
    GIFT: "Brinde",
    PRODUCT: "Produto",
    SERVICE: "Servico",
  };

  if (
    (reward.rewardType === "PRODUCT" || reward.rewardType === "GIFT") &&
    reward.product &&
    reward.product.stock - reward.product.reservedStock <= 0 &&
    reward.product.allowPreOrder
  ) {
    return "Sob encomenda";
  }

  return labels[reward.rewardType];
}
