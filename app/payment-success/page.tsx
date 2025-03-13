"use client"
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount');

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        <CheckCircle className="text-green-500 w-16 h-16 mx-auto" />
        <h1 className="text-2xl font-bold text-green-700 mt-4">Payment Successful!</h1>
        {amount && <p className="text-lg text-green-600 mt-2">You paid ${amount}.</p>}
      </div>
    </div>
  );
}
