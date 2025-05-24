
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/provider/AuthProvider';
import PaymentHistoryModern from '@/components/payment/PaymentHistoryModern';
import PaymentFormModern from '@/components/payment/PaymentFormModern';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, History } from 'lucide-react';

const PaymentsPage = () => {
  const { userType } = useAuth();
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {userType === "doctor" ? "Earnings & Payments" : "My Payments"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {userType === "doctor"
              ? "View your earnings and payment history from consultations."
              : "View and manage your payment history for medical consultations."}
          </p>
        </div>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-fit">
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Payment History</span>
            </TabsTrigger>
            {userType === "user" && (
              <TabsTrigger value="payment" className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Make Payment</span>
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="history" className="mt-6">
            <PaymentHistoryModern />
          </TabsContent>
          
          {userType === "user" && (
            <TabsContent value="payment" className="mt-6">
              <PaymentFormModern
                consultationFee={500}
                doctorId="682f4faf7a8e55202b82c04f"
                doctorName="Dr. Yash"
                onPaymentSuccess={() => {
                  // Refresh the page or switch to history tab
                  window.location.reload();
                }}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default PaymentsPage;
