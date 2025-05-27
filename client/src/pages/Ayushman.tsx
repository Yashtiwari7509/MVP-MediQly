import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Hospital, 
  Users, 
  Search, 
  MapPin, 
  Phone,
  FileText,
  CheckCircle2,
  Clock,
  BadgeIndianRupee,
  Building2,
  Volume,
  Languages,
  Loader2,
  Search as SearchIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/utils/api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AyushmanDetails {
  cardNumber: string;
  beneficiaryName: string;
  familyMembers: number;
  validUntil: string;
  status: string;
  availableBalance: string;
  usedAmount: string;
}

interface Hospital {
  id: number;
  name: string;
  distance: string;
  address: string;
  phone: string;
  specialties: string[];
  rating: number;
  waitTime: string;
}

interface Claim {
  id: string;
  date: string;
  hospital: string;
  treatment: string;
  amount: number;
  status: string;
}

const LoadingCard = () => (
  <Card>
    <CardHeader className="space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-6 w-2/3" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-20 w-full" />
    </CardContent>
  </Card>
);

const LoadingHospital = () => (
  <div className="p-4 border rounded-lg space-y-3">
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-20" />
    </div>
  </div>
);

const LoadingClaim = () => (
  <div className="flex items-center justify-between border-b pb-4">
    <div className="space-y-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
    </div>
    <Skeleton className="h-8 w-24" />
  </div>
);

const Ayushman = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [ayushmanDetails, setAyushmanDetails] = useState<AyushmanDetails | null>(null);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState({
    details: false,
    hospitals: false,
    claims: false,
    verification: false
  });
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [verificationDetails, setVerificationDetails] = useState({
    cardNumber: "",
    mobileNumber: "",
    dateOfBirth: ""
  });
  const [isVerified, setIsVerified] = useState(false);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage;
    window.speechSynthesis.speak(utterance);
  };

  const handleVerification = async () => {
    if (!verificationDetails.cardNumber || !verificationDetails.mobileNumber || !verificationDetails.dateOfBirth) {
      toast.error("Please fill in all verification details");
      return;
    }

    setLoading(prev => ({ ...prev, verification: true }));
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate verification success
      setIsVerified(true);
      fetchUserData();
      toast.success("Verification successful!");
    } catch (error) {
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, verification: false }));
    }
  };

  const fetchUserData = async () => {
    setLoading({
      details: true,
      hospitals: true,
      claims: true,
      verification: false
    });

    try {
      // Simulate API calls with delays
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate data for demo
      const mockData = {
        details: {
          data: {
            cardNumber: verificationDetails.cardNumber,
            beneficiaryName: "Rajesh Kumar",
            familyMembers: 4,
            validUntil: "2025-12-31",
            status: "Active",
            availableBalance: "₹5,00,000",
            usedAmount: "₹1,25,000"
          }
        },
        hospitals: {
          data: [
            {
              id: 1,
              name: "City General Hospital",
              distance: "2.5 km",
              address: "123 Healthcare Lane, New Delhi",
              phone: "+91 98765 43210",
              specialties: ["General Medicine", "Cardiology", "Orthopedics"],
              rating: 4.5,
              waitTime: "15 mins"
            },
            {
              id: 2,
              name: "Apollo Hospital",
              distance: "4.1 km",
              address: "456 Medical Road, New Delhi",
              phone: "+91 98765 43211",
              specialties: ["Neurology", "Oncology", "Pediatrics"],
              rating: 4.8,
              waitTime: "30 mins"
            }
          ]
        },
        claims: {
          data: [
            {
              id: "CLM001",
              date: "2024-02-15",
              hospital: "City General Hospital",
              treatment: "Knee Surgery",
              amount: 75000,
              status: "Approved"
            },
            {
              id: "CLM002",
              date: "2024-01-20",
              hospital: "Apollo Hospital",
              treatment: "Medical Tests",
              amount: 25000,
              status: "Processing"
            }
          ]
        }
      };

      setAyushmanDetails(mockData.details.data);
      setNearbyHospitals(mockData.hospitals.data);
      setRecentClaims(mockData.claims.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data. Please try again later.');
    } finally {
      setLoading({
        details: false,
        hospitals: false,
        claims: false,
        verification: false
      });
    }
  };

  const filteredHospitals = nearbyHospitals.filter((hospital) =>
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const calculateUsagePercentage = () => {
    if (!ayushmanDetails) return 0;
    const used = parseInt(ayushmanDetails.usedAmount.replace(/[^0-9]/g, ''));
    const total = parseInt(ayushmanDetails.availableBalance.replace(/[^0-9]/g, ''));
    return (used / total) * 100;
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Ayushman Bharat</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[100px]">
                <Languages className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
                <SelectItem value="bn">বাংলা</SelectItem>
                <SelectItem value="te">తెలుగు</SelectItem>
                <SelectItem value="ta">தமிழ்</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => speak("Welcome to Ayushman Bharat")}
            >
              <Volume className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isVerified ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SearchIcon className="h-5 w-5" />
                Verify Your Ayushman Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  placeholder="Card Number"
                  value={verificationDetails.cardNumber}
                  onChange={(e) => setVerificationDetails(prev => ({
                    ...prev,
                    cardNumber: e.target.value
                  }))}
                />
                <Input
                  placeholder="Mobile Number"
                  value={verificationDetails.mobileNumber}
                  onChange={(e) => setVerificationDetails(prev => ({
                    ...prev,
                    mobileNumber: e.target.value
                  }))}
                />
                <Input
                  type="date"
                  placeholder="Date of Birth"
                  value={verificationDetails.dateOfBirth}
                  onChange={(e) => setVerificationDetails(prev => ({
                    ...prev,
                    dateOfBirth: e.target.value
                  }))}
                />
              </div>
              <Button 
                className="mt-4 w-full"
                onClick={handleVerification}
                disabled={loading.verification}
              >
                {loading.verification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Details
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              {loading.details ? (
                <>
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                </>
              ) : ayushmanDetails ? (
                <>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Card Status</CardTitle>
                      <Shield className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-500">
                        {ayushmanDetails.status}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Valid until {ayushmanDetails.validUntil}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Balance</CardTitle>
                      <BadgeIndianRupee className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{ayushmanDetails.availableBalance}</div>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Used: {ayushmanDetails.usedAmount}</span>
                          <span className="text-muted-foreground">{calculateUsagePercentage().toFixed(1)}%</span>
                        </div>
                        <Progress value={calculateUsagePercentage()} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Family Members</CardTitle>
                      <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{ayushmanDetails.familyMembers}</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Covered under this policy
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  Unable to fetch card details
                </div>
              )}
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Find Nearby Hospitals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Search hospitals or specialties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {loading.hospitals ? (
                      <>
                        <LoadingHospital />
                        <LoadingHospital />
                        <LoadingHospital />
                      </>
                    ) : (
                      filteredHospitals.map((hospital) => (
                        <div key={hospital.id} className="p-4 border rounded-lg hover:bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{hospital.name}</h3>
                            <Badge variant="outline">{hospital.distance}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {hospital.address}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="h-4 w-4" />
                              {hospital.phone}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {hospital.specialties.map((specialty, index) => (
                              <Badge key={index} variant="secondary">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Claims
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading.claims ? (
                  <div className="space-y-4">
                    <LoadingClaim />
                    <LoadingClaim />
                    <LoadingClaim />
                  </div>
                ) : recentClaims.length > 0 ? (
                  <div className="space-y-4">
                    {recentClaims.map((claim) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold">{claim.hospital}</h3>
                          <p className="text-sm text-muted-foreground">
                            {claim.treatment} • {claim.date}
                          </p>
                          <p className="text-sm font-medium">₹{claim.amount.toLocaleString()}</p>
                        </div>
                        <Badge variant={claim.status === "Approved" ? "outline" : "secondary"}>
                          {claim.status === "Approved" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {claim.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent claims found
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Ayushman; 