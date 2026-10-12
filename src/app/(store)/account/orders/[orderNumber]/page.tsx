import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrderActions } from "@/components/store/account/order-actions";
import { OrderDetails } from "@/components/store/order/order-details";
import { getMyOrder } from "@/services/storefront.server";

type Props = { params: Promise<{ orderNumber: string }> };

export default async function AccountOrderPage({ params }: Props) {
  const { orderNumber } = await params;
  const order = await getMyOrder(orderNumber);
  if (!order) notFound();

  return (
    <div>
      <Link href="/account/orders" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All orders
      </Link>
      <OrderDetails order={order} actions={<OrderActions order={order} />} />
    </div>
  );
}
