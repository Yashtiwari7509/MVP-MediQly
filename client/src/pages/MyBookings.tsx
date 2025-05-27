import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled";
  type: "video";
  createdAt: string;
}

const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Load bookings from localStorage
    const loadBookings = () => {
      try {
        const savedBookings = JSON.parse(localStorage.getItem("myBookings") || "[]");
        setBookings(savedBookings.sort((a: Booking, b: Booking) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load bookings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Clock className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    const updatedBookings = bookings.map(booking =>
      booking.id === bookingId
        ? { ...booking, status: "cancelled" as const }
        : booking
    );
    
    localStorage.setItem("myBookings", JSON.stringify(updatedBookings));
    setBookings(updatedBookings);
    
    toast({
      title: "Success",
      description: "Booking cancelled successfully",
    });
  };

  const handleJoinCall = (bookingId: string) => {
    // Here you would implement the video call functionality
    toast({
      title: "Info",
      description: "Video call feature will be implemented soon",
    });
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Consultations</h1>

        {bookings.length === 0 ? (
          <Card className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Consultations Found</h3>
            <p className="text-gray-600 mb-4">
              You haven't booked any consultations yet.
            </p>
            <Button onClick={() => navigate("/consultation")}>
              Book a Consultation
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{booking.doctorName}</h3>
                    <p className="text-gray-600">{booking.specialization}</p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{booking.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{booking.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Video className="h-4 w-4" />
                    <span>Video Consultation</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  {booking.status === "scheduled" && (
                    <>
                      <Button
                        variant="default"
                        onClick={() => handleJoinCall(booking.id)}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Video Call
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel Booking
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings; 