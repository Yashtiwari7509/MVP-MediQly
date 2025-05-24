
import React, { useState } from "react";
import { useAuth } from "@/provider/AuthProvider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutFormModern from "./CheckoutFormModern";
import api from "@/utils/api";
import { toast } from "sonner";
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  QrCode, 
  Shield, 
  CheckCircle,
  Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_default"
);

interface PaymentFormModernProps {
  doctorId: string;
  doctorName: string;
  consultationFee: number;
  onPaymentSuccess: () => void;
}

const PaymentFormModern: React.FC<PaymentFormModernProps> = ({
  doctorId,
  doctorName,
  consultationFee,
  onPaymentSuccess,
}) => {
  const [paymentType, setPaymentType] = useState<"one-time" | "monthly" | "yearly">("one-time");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "upi" | "wallet">("stripe");
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const { userType } = useAuth();

  const calculateAmount = () => {
    switch (paymentType) {
      case "monthly":
        return consultationFee * 4;
      case "yearly":
        return consultationFee * 40;
      default:
        return consultationFee;
    }
  };

  const getDiscountPercentage = () => {
    switch (paymentType) {
      case "monthly":
        return 0;
      case "yearly":
        return 16;
      default:
        return 0;
    }
  };

  const handlePaymentInit = async () => {
    setLoading(true);
    console.log("Initializing payment...", { paymentType, paymentMethod, doctorId });
    
    try {
      const amount = calculateAmount();
      console.log("Payment amount calculated:", amount);

      const response = await api.post("/payment/create-intent", {
        amount,
        type: paymentType,
        doctorId,
        paymentMethod,
        notes: `${paymentType} payment for consultation with Dr. ${doctorName}`,
      });

      console.log("Payment intent response:", response.data);

      if (response.data.success) {
        setClientSecret(response.data.clientSecret);
        setPaymentId(response.data.paymentId);
        console.log("Payment intent created successfully");
      } else {
        throw new Error(response.data.message || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error("Payment initialization failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (userType !== "user") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle>Access Restricted</CardTitle>
          <CardDescription>
            You must be logged in as a patient to make a payment
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutFormModern 
          paymentId={paymentId} 
          onSuccess={onPaymentSuccess}
          amount={calculateAmount()}
          doctorName={doctorName}
          paymentType={paymentType}
        />
      </Elements>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Doctor Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Dr. {doctorName}</h3>
                <p className="text-muted-foreground">Consultation Payment</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg font-semibold px-3 py-1">
              ₹{consultationFee}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payment Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Choose Your Plan</span>
            </CardTitle>
            <CardDescription>
              Select the payment plan that works best for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={paymentType}
              onValueChange={(value) =>
                setPaymentType(value as "one-time" | "monthly" | "yearly")
              }
              className="space-y-4"
            >
              {/* One-time Payment */}
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="one-time" id="one-time" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="one-time" className="font-medium cursor-pointer">
                      Single Consultation
                    </Label>
                    <span className="font-semibold">₹{consultationFee}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pay for one consultation session
                  </p>
                </div>
              </div>

              {/* Monthly Plan */}
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="monthly" id="monthly" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="monthly" className="font-medium cursor-pointer">
                      Monthly Package
                    </Label>
                    <div className="text-right">
                      <span className="font-semibold">₹{consultationFee * 4}</span>
                      <Badge variant="outline" className="ml-2">Popular</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    4 consultations • ₹{consultationFee} per session
                  </p>
                </div>
              </div>

              {/* Yearly Plan */}
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors relative">
                <RadioGroupItem value="yearly" id="yearly" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="yearly" className="font-medium cursor-pointer">
                      Yearly Package
                    </Label>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm line-through text-muted-foreground">
                          ₹{consultationFee * 48}
                        </span>
                        <span className="font-semibold">₹{consultationFee * 40}</span>
                      </div>
                      <Badge className="ml-2 bg-green-100 text-green-800">Save 16%</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    40 consultations • Best value for regular patients
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Payment Method</span>
            </CardTitle>
            <CardDescription>
              Choose your preferred payment method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="stripe" className="text-xs">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="upi" className="text-xs">
                  <Smartphone className="h-4 w-4 mr-1" />
                  UPI
                </TabsTrigger>
                <TabsTrigger value="wallet" className="text-xs">
                  <QrCode className="h-4 w-4 mr-1" />
                  Wallet
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stripe" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Credit/Debit Card</p>
                      <p className="text-sm text-muted-foreground">Secure payment via Stripe</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['visa', 'mastercard', 'amex', 'discover'].map((card) => (
                      <div key={card} className="h-8 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs font-medium uppercase">{card}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upi" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">UPI Payment</p>
                      <p className="text-sm text-muted-foreground">Pay using any UPI app</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['GPay', 'PhonePe', 'Paytm'].map((app) => (
                      <div key={app} className="h-8 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs font-medium">{app}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="wallet" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                    <QrCode className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Digital Wallet</p>
                      <p className="text-sm text-muted-foreground">Pay via digital wallets</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Amazon Pay', 'PayPal'].map((wallet) => (
                      <div key={wallet} className="h-8 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs font-medium">{wallet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Payment Summary & CTA */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium">Total Amount:</span>
              <div className="text-right">
                {getDiscountPercentage() > 0 && (
                  <div className="text-sm text-muted-foreground line-through">
                    ₹{paymentType === 'yearly' ? consultationFee * 48 : calculateAmount()}
                  </div>
                )}
                <span className="font-bold text-xl text-primary">
                  ₹{calculateAmount().toLocaleString()}
                </span>
                {getDiscountPercentage() > 0 && (
                  <Badge className="ml-2 bg-green-100 text-green-800">
                    {getDiscountPercentage()}% OFF
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secure payment processing • SSL encrypted</span>
            </div>

            <Button
              className="w-full h-12 text-lg"
              onClick={handlePaymentInit}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Pay ₹{calculateAmount().toLocaleString()}</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFormModern;
