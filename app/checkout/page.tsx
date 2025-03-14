"use client";
import { SectionTitle } from "@/components";
import { useProductStore } from "../_zustand/store";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import convertToSubcurrency, { isValidCardNumber, isValidCreditCardCVVOrCVC, isValidCreditCardExpirationDate, isValidEmailAddressFormat, isValidNameOrLastname } from "@/lib/utils";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
const StripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
import CheckoutBOX from "@/components/CheckoutBOX"

const CheckoutPage = () => {
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
    cardName: "",
    cardNumber: "",
    expirationDate: "",
    cvc: "",
    company: "",
    adress: "",
    apartment: "",
    city: "",
    country: "",
    postalCode: "",
    orderNotice: "",
  });
  const { products, total, clearCart } = useProductStore();
  const router = useRouter();
  var amount = total + total / 5 + 5;


  useEffect(() => {
    if (products.length === 0) {
      toast.error("You don't have items in your cart");
      router.push("/cart");
    }
  }, []);

  return (
    <div className="bg-white">
      <SectionTitle title="Checkout" path="Home | Cart | Checkout" />
      {/* Background color split screen for large screens */}
      <div
        className="hidden h-full w-1/2 bg-white lg:block"
        aria-hidden="true"
      />
      <div
        className="hidden h-full w-1/2 bg-gray-50 lg:block"
        aria-hidden="true"
      />

      <main className="relative mx-auto grid max-w-screen-2xl grid-cols-1 gap-x-16 lg:grid-cols-2 lg:px-8 xl:gap-x-48">
        <h1 className="sr-only">Order information</h1>

        <div
          aria-labelledby="summary-heading"
          className="bg-white rounded-2xl shadow-lg max-w-3xl lg:col-start-2 lg:row-start-2 lg:bg-transparent lg:px-10 mt-10"
        >

          <div className="mx-10 max-w-lg lg:15">
            
          <h2 className="text-2xl font-bold text-gray-800 mb-6 mt-6">Order Summary</h2>

            <ul
              role="list"
              className="divide-y divide-gray-200 text-sm font-medium text-gray-900"
            >
              {products.map((product) => (
                <li
                  key={product?.id}
                  className="flex items-start space-x-4 py-6"
                >
                  <Image
                    src={product?.image ? `/${product?.image}` : "/product_placeholder.jpg"}
                    alt={product?.title}
                    width={80}
                    height={80}
                    className="h-20 w-20 flex-none rounded-md object-cover object-center"
                  />
                  <div className="flex-auto space-y-1">
                    <h3>{product?.title}</h3>
                    <p className="text-gray-500">x{product?.amount}</p>
                  </div>
                  <p className="flex-none text-base font-medium">
                    ${product?.price}
                  </p>
                  <p></p>
                </li>
              ))}
            </ul>

            <dl className="hidden space-y-6 border-t border-gray-200 pt-6 text-sm font-medium text-gray-900 lg:block">
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd>${total}</dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Shipping</dt>
                <dd>$5</dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Taxes</dt>
                <dd>${total / 5}</dd>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <dt className="text-base">Total</dt>
                <dd className="text-base">
                  ${total === 0 ? 0 : Math.round(total + total / 5 + 5)}
                </dd>
              </div>
            </dl>
          </div>
          <div aria-labelledby="payment-heading">
            <Elements stripe={StripePromise}
              options={{
                currency: 'usd',
                amount: convertToSubcurrency(amount),
                mode: 'payment',
              }}>
              <CheckoutBOX amount={amount} />
            </Elements>
          </div>
        </div>

      </main>
    </div>
  );
};

export default CheckoutPage;
