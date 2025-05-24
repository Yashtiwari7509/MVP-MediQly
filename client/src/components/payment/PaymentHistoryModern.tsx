import React, { useEffect, useState } from "react";
import api from "@/utils/api";
import { useAuth } from "@/provider/AuthProvider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, Download, Calendar, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePaymentHistory } from "@/hooks/use-payment";

interface Payment {
  _id: string;
  amount: number;
  type: string;
  status: string;
  transactionId: string;
  createdAt: string;
  paymentMethod?: string;
  doctorId: {
    firstName: string;
    lastName: string;
    specialization: string;
  };
  userId: {
    firstName: string;
    lastName: string;
  };
}

const PaymentHistoryModern = () => {
  // const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  // const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const { userType } = useAuth();

  // useEffect(() => {
  //   const fetchPayments = async () => {
  //     try {
  //       const endpoint =
  //         userType === "doctor"
  //           ? "/payment/doctor-history"
  //           : "/payment/user-history";

  //       const response = await api.get(endpoint);

  //       if (response.data.success) {
  //         setPayments(response.data.payments);
  //         setFilteredPayments(response.data.payments);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching payments:", error);
  //       toast.error("Failed to load payment history");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (userType) {
  //     fetchPayments();
  //   }
  // }, [userType]);

  // Filter payments based on search and filters

  const { error, data: payments, isLoading } = usePaymentHistory(userType);

  useEffect(() => {
    if (!payments) return; //
    let filtered = payments;

    // Search filter
    if (searchTerm) {
      filtered = filtered!.filter((payment) => {
        const searchFields = [
          payment.transactionId,
          userType === "user"
            ? `${payment.doctorId?.firstName} ${payment.doctorId?.lastName}`
            : `${payment.userId?.firstName} ${payment.userId?.lastName}`,
          payment.doctorId?.specialization,
          payment.amount.toString(),
        ]
          .join(" ")
          .toLowerCase();

        return searchFields.includes(searchTerm.toLowerCase());
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered!.filter((payment) => payment.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered!.filter((payment) => payment.type === typeFilter);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered!.filter(
        (payment) => new Date(payment.createdAt) >= filterDate
      );
    }

    setFilteredPayments(filtered!);
  }, [payments, searchTerm, statusFilter, typeFilter, dateRange, userType,isLoading]);

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      "one-time": "bg-blue-100 text-blue-800",
      monthly: "bg-green-100 text-green-800",
      yearly: "bg-purple-100 text-purple-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }`}
      >
        {type.replace("-", " ").toUpperCase()}
      </span>
    );
  };

  const calculateTotalAmount = () => {
    if (!filteredPayments || filteredPayments.length === 0) return 0;

    return filteredPayments
      .filter((p) => p.status === "completed")
      .reduce((sum, payment) => sum + payment.amount, 0);
  };
  

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Payment History</CardTitle>
          </div>
          <CardDescription>Loading payment records...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Payments
                </p>
                <p className="text-2xl font-bold">{filteredPayments?.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {userType === "doctor" ? "Total Earned" : "Total Spent"}
                </p>
                <p className="text-2xl font-bold">
                  ₹{calculateTotalAmount().toLocaleString()}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-2xl font-bold">
                  {
                    filteredPayments.filter((p) => p.status === "completed")
                      .length
                  }
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-green-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Payment History</CardTitle>
            </div>
            <Button variant="outline" size="sm" className="w-fit">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by transaction ID, name, or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No payments found</h3>
              <p className="text-muted-foreground">
                {searchTerm ||
                statusFilter !== "all" ||
                typeFilter !== "all" ||
                dateRange !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "No payment records available"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* <ScrollArea className="h-[500px] overflow-auto"> */}
              <div className="overflow-x-auto h-[500px]">
                <div className="inline-block min-w-full align-middle">
                  <Table className="min-w-max relative">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="min-w-[200px]">
                          {userType === "user" ? "Doctor" : "Patient"}
                        </TableHead>
                        <TableHead className="min-w-[120px]">Type</TableHead>
                        <TableHead className="min-w-[120px]">Method</TableHead>
                        <TableHead className="min-w-[150px] text-right">
                          Amount
                        </TableHead>
                        <TableHead className="min-w-[120px]">Status</TableHead>
                        <TableHead className="min-w-[200px]">
                          Transaction ID
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow
                          key={payment._id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            {new Date(payment.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {userType === "user"
                                  ? `Dr. ${payment.doctorId?.firstName} ${payment.doctorId?.lastName}`
                                  : `${payment.userId?.firstName} ${payment.userId?.lastName}`}
                              </span>
                              {userType === "user" &&
                                payment.doctorId?.specialization && (
                                  <span className="text-sm text-muted-foreground">
                                    {payment.doctorId.specialization}
                                  </span>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(payment.type)}</TableCell>
                          <TableCell>
                            <span className="text-sm capitalize">
                              {payment.paymentMethod || "Card"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {payment.transactionId?.slice(-10) || "N/A"}
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {/* </ScrollArea> */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistoryModern;
