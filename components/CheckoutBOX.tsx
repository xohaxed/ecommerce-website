import React, { useEffect, useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement
} from "@stripe/react-stripe-js";
import toast from "react-hot-toast";
import convertToSubcurrency from "@/lib/utils";

const CheckoutBOX = ({ amount }: { amount: number }) => {
  if (process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY == undefined) {
    throw new Error("Missing STRIPE_PUBLIC_KEY environment variable");
  }

  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: convertToSubcurrency(amount) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          console.error("clientSecret not received:", data);
        }
      })
      .catch((err) => console.error("Error fetching clientSecret:", err));
  }, [amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe is not initialized");
      return;
    }

    setLoading(true);

    const { error: submitError } = await elements.submit();

    if (submitError) {
      setErrorMessage(submitError.message || "Something went wrong");
      setLoading(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?amount=${amount}/`,
      },
    });

    if (error) {
      setErrorMessage(error.message || "Something went wrong");
      toast.error(error.message || "Payment failed");
    }

    setLoading(false);
  };

  if (!clientSecret || !stripe || !elements) {
    return (
      <div className="flex items-center justify-center">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-2 rounded-md">
      {clientSecret && <PaymentElement />}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <button type="submit" disabled={!stripe || loading} className="text-white w-full p-5 bg-black mt-2 rounded-md font-bold disabled:opacity-50 disabled:animate-pulse">
        {loading ? "Processing..." : "Pay"}
      </button>
    </form>
  );
};

export default CheckoutBOX;
