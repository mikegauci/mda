import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { getCurrentUser } from "@/lib/auth/session";
import { codePageMetadata } from "@/lib/seo";

export function generateMetadata() {
  return codePageMetadata("checkout", "Checkout", { noindex: true });
}

async function Checkout() {
  const user = await getCurrentUser();
  return <CheckoutForm email={user?.email} />;
}

export default function Page() {
  return (
    <Container className="pt-[120px] pb-[60px]">
      <h1 className="section-title mb-11">Checkout</h1>
      <Suspense>
        <Checkout />
      </Suspense>
    </Container>
  );
}
