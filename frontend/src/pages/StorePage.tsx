import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Filter,
  Package,
  Search,
  ShoppingBag,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Loading } from "../components/ui/Loading";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { api } from "../services/api";
import type { Product, ProductOrder, ProductOrderType } from "../types/domain";
import { getApiErrorMessage } from "../utils/apiError";
import { cn } from "../utils/cn";
import { formatCurrency, formatDate } from "../utils/format";
import { uploadReceipt, validateReceiptFile } from "../utils/receipts";
import {
  getPaymentStatusTone,
  getProductOrderStatusTone,
  paymentStatusLabels,
  productOrderStatusLabels,
  productOrderTypeLabels,
} from "../utils/status";
import {
  productOrderFormSchema,
  type ProductOrderFormData,
} from "../validations/storeValidation";

type OrderDraft = {
  product: Product;
  type: ProductOrderType;
};

function availableStock(product: Product) {
  return Math.max(product.stock - product.reservedStock, 0);
}

export function StorePage() {
  const navigate = useNavigate();
  const [availableOnly, setAvailableOnly] = useState(false);
  const [category, setCategory] = useState("");
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [preOrderOnly, setPreOrderOnly] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<ProductOrderFormData>({
    defaultValues: {
      notes: "",
      quantity: 1,
    },
    mode: "onTouched",
    resolver: zodResolver(productOrderFormSchema) as unknown as Resolver<ProductOrderFormData>,
  });

  const loadStore = useCallback(async () => {
    try {
      const [productsResponse, ordersResponse] = await Promise.all([
        api.get<Product[]>("/products?active=true"),
        api.get<ProductOrder[]>("/product-orders"),
      ]);

      setProducts(productsResponse.data);
      setOrders(ordersResponse.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  useEffect(() => {
    reset({
      notes: "",
      quantity: 1,
    });
  }, [draft, reset]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");

    return products.filter((product) => {
      const matchesName = product.name.toLocaleLowerCase("pt-BR").includes(term);
      const matchesCategory = category ? product.category === category : true;
      const matchesAvailable = availableOnly ? availableStock(product) > 0 : true;
      const matchesPreOrder = preOrderOnly ? product.allowPreOrder : true;

      return matchesName && matchesCategory && matchesAvailable && matchesPreOrder;
    });
  }, [availableOnly, category, preOrderOnly, products, query]);

  const draftQuantity = Number(watch("quantity") || 0);
  const draftTotal = draft
    ? Number(draft.product.price) * (Number.isFinite(draftQuantity) ? draftQuantity : 0)
    : 0;

  function openDraft(product: Product, type: ProductOrderType) {
    setDraft({ product, type });
  }

  async function submitOrder(data: ProductOrderFormData) {
    if (!draft || submitting) {
      return;
    }

    const available = availableStock(draft.product);

    if (draft.type === "RESERVATION" && data.quantity > available) {
      toast.error("Nao e permitido reservar quantidade maior que o estoque disponivel.");
      return;
    }

    if (draft.type === "PRE_ORDER" && !draft.product.allowPreOrder) {
      toast.error("Este produto nao permite encomenda.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post(
        draft.type === "RESERVATION"
          ? "/product-orders/reserve"
          : "/product-orders/pre-order",
        {
          notes: data.notes?.trim() || null,
          productId: draft.product.id,
          quantity: data.quantity,
        },
      );
      toast.success(
        draft.type === "RESERVATION"
          ? "Produto reservado. O pagamento sera confirmado pela equipe."
          : "Encomenda solicitada. A equipe acompanha pelo painel.",
      );
      setDraft(null);
      await loadStore();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelOrder(order: ProductOrder) {
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/product-orders/${order.id}/cancel`);
      toast.success("Pedido cancelado.");
      await loadStore();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function handleReceiptChange(order: ProductOrder, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateReceiptFile(file);

    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      return;
    }

    uploadReceipt<ProductOrder>(`/product-orders/${order.id}/receipt`, file)
      .then(async () => {
        toast.success("Comprovante enviado. Aguardando confirmacao.");
        await loadStore();
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
      })
      .finally(() => {
        setUploadingId(null);
        event.target.value = "";
      });

    setUploadingId(order.id);
  }

  if (loading) {
    return <Loading label="Carregando loja" />;
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
              Loja
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Reserve produtos ou solicite encomendas para retirada.
            </p>
          </div>
        </div>
        <Badge tone="red">{orders.length} pedidos</Badge>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <Card>
            <CardContent>
              <div className="grid gap-3 lg:grid-cols-[1fr_13rem_auto_auto]">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-600"
                    aria-hidden="true"
                  />
                  <input
                    className="h-12 w-full rounded-md border border-white/10 bg-club-black pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-club-red"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar produto"
                    value={query}
                  />
                </div>
                <Select
                  aria-label="Categoria"
                  onChange={(event) => setCategory(event.target.value)}
                  value={category}
                >
                  <option value="">Todas categorias</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
                <ToggleButton active={availableOnly} onClick={() => setAvailableOnly((value) => !value)}>
                  Disponivel agora
                </ToggleButton>
                <ToggleButton active={preOrderOnly} onClick={() => setPreOrderOnly((value) => !value)}>
                  Sob encomenda
                </ToggleButton>
              </div>
            </CardContent>
          </Card>

          {filteredProducts.length ? (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  onPreOrder={() => openDraft(product, "PRE_ORDER")}
                  onReserve={() => openDraft(product, "RESERVATION")}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              description="Ajuste os filtros ou aguarde novos produtos ativos."
              icon={Package}
              title="Sem produtos"
            />
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              Resumo
            </h2>
          </CardHeader>
          <CardContent>
            {draft ? (
              <div className="space-y-3">
                <SummaryLine label="Produto" value={draft.product.name} />
                <SummaryLine label="Tipo" value={productOrderTypeLabels[draft.type]} />
                <SummaryLine label="Quantidade" value={String(draftQuantity || 0)} />
                <SummaryLine label="Total" value={formatCurrency(draftTotal)} />
              </div>
            ) : (
              <div className="rounded-md border border-white/10 bg-club-black p-4 text-sm leading-6 text-zinc-500">
                Escolha reservar ou encomendar um produto para montar o resumo.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl font-semibold uppercase text-white">
              Meus pedidos
            </h2>
            <Filter className="size-5 text-club-red" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          {orders.length ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderRow
                  isCanceling={submitting}
                  isUploading={uploadingId === order.id}
                  key={order.id}
                  onCancel={() => cancelOrder(order)}
                  onReceiptChange={(event) => handleReceiptChange(order, event)}
                  order={order}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              description="Reservas e encomendas aparecem aqui depois da solicitacao."
              icon={ShoppingBag}
              title="Sem pedidos"
            />
          )}
        </CardContent>
      </Card>

      <Modal
        description="Informe a quantidade e confirme para enviar a solicitacao."
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={() => setDraft(null)} type="button" variant="secondary">
              Cancelar
            </Button>
            <Button form="product-order-form" isLoading={submitting} type="submit">
              Confirmar
            </Button>
          </div>
        }
        isOpen={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.type === "RESERVATION" ? "Reservar produto" : "Encomendar produto"}
      >
        <form
          id="product-order-form"
          className="space-y-4"
          onSubmit={handleSubmit(submitOrder as SubmitHandler<ProductOrderFormData>)}
        >
          <div className="rounded-md border border-white/10 bg-club-black p-4">
            <p className="font-display text-2xl font-semibold uppercase text-white">
              {draft?.product.name}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {draft ? formatCurrency(draft.product.price) : "-"} cada
            </p>
          </div>
          <Input
            error={errors.quantity?.message}
            label="Quantidade"
            min="1"
            type="number"
            {...register("quantity")}
          />
          <Textarea
            error={errors.notes?.message}
            label="Observacao"
            placeholder="Opcional"
            {...register("notes")}
          />
        </form>
      </Modal>
    </div>
  );
}

function ProductCard({
  onPreOrder,
  onReserve,
  product,
}: {
  onPreOrder: () => void;
  onReserve: () => void;
  product: Product;
}) {
  const available = availableStock(product);
  const canReserve = available > 0;
  const canPreOrder = !canReserve && product.allowPreOrder;

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-club-surface transition hover:-translate-y-1 hover:border-club-red/45">
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-club-black">
        {product.imageUrl ? (
          <img
            alt={product.name}
            className="h-full w-full object-cover opacity-80"
            src={product.imageUrl}
          />
        ) : (
          <Package className="size-14 text-club-red" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <Badge className="absolute bottom-4 left-4" tone={canReserve ? "green" : "amber"}>
          {canReserve ? `${available} disponiveis` : "Sem estoque"}
        </Badge>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-2xl font-semibold uppercase text-white">
              {product.name}
            </h2>
            <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-500">
              {product.description ?? "Produto Club do Rafa"}
            </p>
          </div>
          <Badge tone="zinc">{product.category}</Badge>
        </div>
        <strong className="mt-4 block font-display text-3xl text-white">
          {formatCurrency(product.price)}
        </strong>
        <div className="mt-5">
          {canReserve ? (
            <Button className="w-full" onClick={onReserve} size="sm" type="button">
              Reservar
            </Button>
          ) : canPreOrder ? (
            <Button className="w-full" onClick={onPreOrder} size="sm" type="button">
              Encomendar
            </Button>
          ) : (
            <Button className="w-full" disabled size="sm" type="button" variant="secondary">
              Indisponivel
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function OrderRow({
  isCanceling,
  isUploading,
  onCancel,
  onReceiptChange,
  order,
}: {
  isCanceling: boolean;
  isUploading: boolean;
  onCancel: () => void;
  onReceiptChange: (event: ChangeEvent<HTMLInputElement>) => void;
  order: ProductOrder;
}) {
  const firstItem = order.items?.[0];
  const canCancel =
    order.status !== "DELIVERED" &&
    order.status !== "CANCELED" &&
    order.paymentStatus !== "PAID";

  return (
    <article className="grid gap-4 rounded-md border border-white/10 bg-club-black p-4 lg:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <strong className="font-display text-2xl font-semibold uppercase text-white">
            {firstItem?.product?.name ?? "Produto"}
          </strong>
          <Badge tone={getProductOrderStatusTone(order.status)}>
            {productOrderStatusLabels[order.status]}
          </Badge>
          <Badge tone={getPaymentStatusTone(order.paymentStatus)}>
            {paymentStatusLabels[order.paymentStatus]}
          </Badge>
          <Badge tone="zinc">{productOrderTypeLabels[order.orderType]}</Badge>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          {formatDate(order.createdAt)} - {firstItem?.quantity ?? 0} un. -{" "}
          {formatCurrency(order.total)}
        </p>
        {order.receiptUrl ? (
          <a
            className="mt-2 inline-flex text-sm font-bold text-club-red underline-offset-4 hover:underline"
            href={order.receiptUrl}
            rel="noreferrer"
            target="_blank"
          >
            {order.receiptFileName ?? "Ver comprovante"}
          </a>
        ) : null}
        {order.infinityPayUrl && order.paymentStatus !== "PAID" ? (
          <a
            className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md bg-club-red px-3 text-sm font-bold text-white transition hover:bg-red-700 sm:w-auto"
            href={order.infinityPayUrl}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Pagar via Infinity Pay
          </a>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
        <label
          className={cn(
            "inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-bold text-zinc-100 transition hover:border-white/20 hover:bg-white/10",
            (order.status === "DELIVERED" || order.paymentStatus === "PAID") &&
              "pointer-events-none opacity-50",
          )}
        >
          <UploadCloud className="size-4" aria-hidden="true" />
          {isUploading ? "Enviando" : "Comprovante"}
          <input
            accept="image/*,application/pdf"
            className="sr-only"
            disabled={isUploading || order.status === "DELIVERED" || order.paymentStatus === "PAID"}
            onChange={onReceiptChange}
            type="file"
          />
        </label>
        {canCancel ? (
          <Button isLoading={isCanceling} onClick={onCancel} size="sm" type="button" variant="danger">
            <XCircle className="size-4" aria-hidden="true" />
            Cancelar
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function ToggleButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "min-h-12 rounded-md border border-white/10 bg-club-black px-3 text-sm font-bold text-zinc-400 transition hover:border-club-red/50 hover:text-white",
        active && "border-club-red bg-club-red/10 text-white",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-club-black p-3 text-sm">
      <span className="font-bold uppercase text-zinc-500">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
