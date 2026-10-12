import { OrderList } from "@/components/store/account/order-list";

export default function AccountOrdersPage() {
  return (
    <div>
      <h2 className="mb-4 font-sans text-lg font-semibold">My orders</h2>
      <OrderList />
    </div>
  );
}
