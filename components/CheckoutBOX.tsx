"use client";
import React, {useEffect, useState} from "react";
import { 
  useStripe,
  useElements,
  PaymentElement
} from "@stripe/react-stripe-js";
import toast from "react-hot-toast";
import convertToSubcurrency from "@/lib/utils";

const CheckoutBOX = ({amount}: {amount:number}) => {
  if(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY == undefined){
    throw new Error("Missing STRIPE_PUBLIC_KEY environment variable");
  }

  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
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
  const makePurchase = async () => {
    if (
      checkoutForm.name.length > 0 &&
      checkoutForm.lastname.length > 0 &&
      checkoutForm.phone.length > 0 &&
      checkoutForm.email.length > 0 &&
      checkoutForm.cardName.length > 0 &&
      checkoutForm.expirationDate.length > 0 &&
      checkoutForm.cvc.length > 0 &&
      checkoutForm.company.length > 0 &&
      checkoutForm.adress.length > 0 &&
      checkoutForm.apartment.length > 0 &&
      checkoutForm.city.length > 0 &&
      checkoutForm.country.length > 0 &&
      checkoutForm.postalCode.length > 0
    ) {
      if (!isValidNameOrLastname(checkoutForm.name)) {
        toast.error("You entered invalid format for name");
        return;
      }

      if (!isValidNameOrLastname(checkoutForm.lastname)) {
        toast.error("You entered invalid format for lastname");
        return;
      }

      if (!isValidEmailAddressFormat(checkoutForm.email)) {
        toast.error("You entered invalid format for email address");
        return;
      }

      if (!isValidNameOrLastname(checkoutForm.cardName)) {
        toast.error("You entered invalid format for card name");
        return;
      }

      if (!isValidCardNumber(checkoutForm.cardNumber)) {
        toast.error("You entered invalid format for credit card number");
        return;
      }

      if (!isValidCreditCardExpirationDate(checkoutForm.expirationDate)) {
        toast.error(
          "You entered invalid format for credit card expiration date"
        );
        return;
      }

      if (!isValidCreditCardCVVOrCVC(checkoutForm.cvc)) {
        toast.error("You entered invalid format for credit card CVC or CVV");
        return;
      }

      // sending API request for creating a order
      const response = fetch("http://localhost:3001/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: checkoutForm.name,
          lastname: checkoutForm.lastname,
          phone: checkoutForm.phone,
          email: checkoutForm.email,
          company: checkoutForm.company,
          adress: checkoutForm.adress,
          apartment: checkoutForm.apartment,
          postalCode: checkoutForm.postalCode,
          status: "processing",
          total: total,
          city: checkoutForm.city,
          country: checkoutForm.country,
          orderNotice: checkoutForm.orderNotice,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const orderId: string = data.id;
          // for every product in the order we are calling addOrderProduct function that adds fields to the customer_order_product table
          for (let i = 0; i < products.length; i++) {
            let productId: string = products[i].id;
            addOrderProduct(orderId, products[i].id, products[i].amount);
          }
        })
        .then(() => {
          setCheckoutForm({
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
          clearCart();
          toast.success("Order created successfuly");
          setTimeout(() => {
            router.push("/");
          }, 1000);
        });
    } else {
      toast.error("You need to enter values in the input fields");
    }
  };

  const addOrderProduct = async (
    orderId: string,
    productId: string,
    productQuantity: number
  ) => {
    // sending API POST request for the table customer_order_product that does many to many relatioship for order and product
    const response = await fetch("http://localhost:3001/api/order-product", {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerOrderId: orderId,
        productId: productId,
        quantity: productQuantity,
      }),
    });
  };

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
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
            return_url: "http://localhost:3000/checkout/success",
        },
    });

    if (error) {
        setErrorMessage(error.message || "Something went wrong");
    }
};


  return (
    <form onSubmit={handleSubmit} className ="bg-white p-2 rounded-md">
      {clientSecret && <PaymentElement />}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <button type="submit" onClick={makePurchase} disabled={!stripe || loading} className="text-white w-full p-5 bg-black mt-2 rounded-md font-bold disabled:opacity-50 disabled:animate-pulse">
        {loading ? "Processing..." : "Pay"}
      </button>
    </form>
  );
};

export default CheckoutBOX;
