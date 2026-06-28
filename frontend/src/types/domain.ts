import type { User } from "./auth";

export type Service = {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  durationLabel?: string | null;
  durationMinutes: number;
  imageUrl?: string | null;
  active: boolean;
};

export type Professional = {
  id: string;
  userId: string;
  specialty: string;
  commissionPercent: string;
  online: boolean;
  active: boolean;
  user?: User;
};

export type ProfessionalTimeBlock = {
  id: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
  createdAt: string;
};

export type Payment = {
  id: string;
  appointmentId: string;
  clientId: string;
  amount: string;
  method: "PIX" | "CARD" | "CASH";
  status: "PENDING" | "AWAITING_CONFIRMATION" | "PAID" | "CANCELED";
  infinityPayUrl?: string | null;
  receiptUrl?: string | null;
  receiptFileName?: string | null;
  receiptUploadedAt?: string | null;
  confirmedById?: string | null;
  confirmedAt?: string | null;
  confirmationNote?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: User;
  appointment?: Appointment;
};

export type PaymentStatus = Payment["status"];

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  costPrice: string;
  stock: number;
  reservedStock: number;
  category: string;
  imageUrl?: string | null;
  active: boolean;
  allowPreOrder: boolean;
};

export type Plan = {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  benefits: string[];
  active: boolean;
  highlighted: boolean;
};

export type ClientPlan = {
  id: string;
  clientId: string;
  planId: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELED";
  startDate?: string | null;
  endDate?: string | null;
  paymentStatus: PaymentStatus;
  infinityPayUrl?: string | null;
  receiptUrl?: string | null;
  receiptFileName?: string | null;
  receiptUploadedAt?: string | null;
  confirmedById?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: User;
  plan?: Plan;
};

export type ProductOrderStatus =
  | "RESERVED"
  | "PRE_ORDER_REQUESTED"
  | "UNDER_REVIEW"
  | "ORDERED"
  | "AVAILABLE_FOR_PICKUP"
  | "DELIVERED"
  | "CANCELED";

export type ProductOrderType = "RESERVATION" | "PRE_ORDER";

export type ProductOrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  product?: Product;
};

export type ProductOrder = {
  id: string;
  clientId: string;
  status: ProductOrderStatus;
  orderType: ProductOrderType;
  paymentStatus: PaymentStatus;
  paymentMethod?: "PIX" | "CARD" | "CASH" | null;
  infinityPayUrl?: string | null;
  total: string;
  notes?: string | null;
  receiptUrl?: string | null;
  receiptFileName?: string | null;
  receiptUploadedAt?: string | null;
  paymentConfirmedById?: string | null;
  paymentConfirmedAt?: string | null;
  deliveredById?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: User;
  items?: ProductOrderItem[];
};

export type Appointment = {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "CONFIRMED" | "CANCELED" | "FINISHED";
  notes?: string | null;
  totalValue: string;
  paymentMethod?: "PIX" | "CARD" | "CASH" | null;
  isExtraSlot: boolean;
  cancelReason?: string | null;
  canceledById?: string | null;
  canceledAt?: string | null;
  confirmedById?: string | null;
  confirmedAt?: string | null;
  finishedById?: string | null;
  finishedAt?: string | null;
  client?: User;
  professional?: Professional;
  service?: Service;
  payment?: Payment | null;
};

export type Reward = {
  id: string;
  name: string;
  description?: string | null;
  requiredPoints: number;
  rewardType: "SERVICE" | "PRODUCT" | "DISCOUNT" | "GIFT";
  serviceId?: string | null;
  productId?: string | null;
  discountValue?: string | null;
  imageUrl?: string | null;
  active: boolean;
  service?: Service | null;
  product?: Product | null;
};

export type RewardRedemption = {
  id: string;
  clientId: string;
  rewardId: string;
  productOrderId?: string | null;
  pointsUsed: number;
  status: "PENDING" | "APPROVED" | "CANCELED";
  code?: string | null;
  reward?: Reward;
  productOrder?: ProductOrder | null;
};

export type AvailabilitySlot = {
  startTime: string;
  endTime: string;
  available: boolean;
};

export type AvailabilityResponse = {
  date: string;
  professionalId: string;
  serviceId: string;
  durationMinutes: number;
  slots: AvailabilitySlot[];
};
