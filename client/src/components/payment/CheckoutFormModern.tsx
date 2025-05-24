import React, { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, CreditCard, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import api from "@/utils/api";

interface CheckoutFormModernProps {
  paymentId: string | null;
  onSuccess: () => void;
  amount: number;
  doctorName: string;
  paymentType: string;
}

const CheckoutFormModern: React.FC<CheckoutFormModernProps> = ({
  paymentId,
  onSuccess,
  amount,
  doctorName,
  paymentType,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(stripe, elements, paymentId);

    if (!stripe || !elements || !paymentId) {
      toast.error("Payment system not ready. Please try again.");
      return;
    }

    setProcessing(true);

    try {
      console.log("Starting payment confirmation...");

      const { paymentIntent, error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: "yash ttt", // Ideally from your app state
              email: "yash@gmail.com", // (optional but recommended)
              address: {
                line1: "123 ABC Street",
                city: "Bangalore",
                state: "Karnataka",
                postal_code: "560001",
                country: "IN",
              },
            },
          },
        },
        redirect: "if_required",
      });

      console.log("Payment confirmation result:", { paymentIntent, error });

      if (error) {
        console.error("Payment error:", error);
        toast.error(error.message || "Payment failed. Please try again.");
        setProcessing(false);
      } else if (paymentIntent) {
        console.log("Payment intent status:", paymentIntent.status);

        if (paymentIntent.status === "succeeded") {
          console.log("Payment succeeded, confirming with backend...");

          try {
            const response = await api.post("/payment/confirm", {
              paymentId,
              transactionId: paymentIntent.id,
            });

            console.log("Backend confirmation response:", response.data);

            if (response.data.success) {
              toast.success("Payment successful! 🎉");
              onSuccess();
            } else {
              throw new Error(
                response.data.message || "Failed to confirm payment"
              );
            }
          } catch (backendError) {
            console.error("Backend confirmation error:", backendError);
            toast.error(
              "Payment processed but confirmation failed. Please contact support."
            );
          }
        } else if (paymentIntent.status === "requires_action") {
          toast.error(
            "Payment requires additional authentication. Please try again."
          );
          setProcessing(false);
        } else {
          toast.error(
            `Payment status: ${paymentIntent.status}. Please try again.`
          );
          setProcessing(false);
        }
      } else {
        toast.error("Payment processing failed. Please try again.");
        setProcessing(false);
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Complete Your Payment</CardTitle>
            <CardDescription>
              {paymentType} payment to Dr. {doctorName} - ₹
              {amount.toLocaleString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <PaymentElement
              options={{
                layout: "tabs",
                paymentMethodOrder: ["card", "ideal"],
              }}
            />
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Your payment is secured with 256-bit SSL encryption</span>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full h-12"
            disabled={!stripe || !elements || processing}
          >
            {processing ? (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 animate-spin" />
                <span>Processing Payment...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Pay ₹{amount.toLocaleString()}</span>
              </div>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CheckoutFormModern;
