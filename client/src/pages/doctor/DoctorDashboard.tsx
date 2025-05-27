import { useAuth } from "@/auth/AuthProvider";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, MessageSquare, Star, Activity } from "lucide-react";

const DoctorDashboard = () => {
  const { currentDoctor } = useAuth();

  const stats = [
    {
      title: "Total Patients",
      value: "124",
      icon: Users,
      trend: "+12%",
      color: "text-blue-500",
    },
    {
      title: "Consultations",
      value: "48",
      icon: MessageSquare,
      trend: "+8%",
      color: "text-green-500",
    },
    {
      title: "Rating",
      value: "4.8",
      icon: Star,
      trend: "+0.2",
      color: "text-yellow-500",
    },
    {
      title: "Response Rate",
      value: "95%",
      icon: Activity,
      trend: "+3%",
      color: "text-purple-500",
    },
  ];

  const upcomingAppointments = [
    {
      patientName: "John Doe",
      time: "10:00 AM",
      date: "Today",
      type: "Video Call",
    },
    {
      patientName: "Jane Smith",
      time: "2:30 PM",
      date: "Today",
      type: "Chat",
    },
    {
      patientName: "Mike Johnson",
      time: "11:15 AM",
      date: "Tomorrow",
      type: "Video Call",
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold primary-grad">
                Welcome back, Dr. {currentDoctor?.firstName}
              </h1>
              <p className="text-gray-500 mt-1">
                Here's your practice overview
              </p>
            </div>
            <Button className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Update Availability
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    <p className="text-sm text-green-500 mt-1">{stat.trend}</p>
                  </div>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </Card>
            ))}
          </div>

          {/* Appointments Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
                <Calendar className="h-5 w-5 text-gray-500" />
              </div>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{appointment.patientName}</h3>
                      <p className="text-sm text-gray-500">
                        {appointment.date} at {appointment.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {appointment.type}
                      </span>
                      <Button variant="outline" size="sm">
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <Activity className="h-4 w-4" />
                  <p>New patient consultation completed</p>
                  <span className="ml-auto">2h ago</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <MessageSquare className="h-4 w-4" />
                  <p>Prescription updated for Jane Smith</p>
                  <span className="ml-auto">4h ago</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <Star className="h-4 w-4" />
                  <p>Received a 5-star rating from John Doe</p>
                  <span className="ml-auto">6h ago</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DoctorDashboard; 