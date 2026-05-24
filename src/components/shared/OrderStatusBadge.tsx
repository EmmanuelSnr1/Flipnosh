import type { OrderStatus } from "@/types";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/stores/mock-store";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_TONE[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}