import { Link, useLocation } from "react-router-dom";
import {
  AlignCenterVertical,
  Stethoscope,
  HeartPulse,
  Home,
  MessageSquare,
  Bot,
  Menu,
  X,
  Award,
  AlertCircle,
  Youtube,
  Share2,
  Apple,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import Logo from "../Logo";

const sidebarItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  {
    icon: AlignCenterVertical,
    label: "Health Tracker",
    path: "/health-tracker",
  },
  { icon: Stethoscope, label: "Consult Doctor", path: "/consultation" },
  {
    icon: Apple,
    label: "Diet Plans",
    path: "/diet",
  },
  { icon: Award, label: "Ayushman", path: "/ayushman" },
  { icon: Bot, label: "AI Doctor", path: "/ai-doctor" },
  { icon: Youtube, label: "Health Feed", path: "/health-feed" },
  { icon: Share2, label: "Reposts", path: "/reposts" },
  { icon: AlertCircle, label: "Emergency", path: "/emergency" },
];

export function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Function to toggle sidebar using CSS class
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          isOpen === false ? "sidebar-closed" : "sidebar-open",
          "fixed inset-y-0 border-r-[1px] left-0 flex flex-col w-64 bg-primary/5 backdrop-blur-xl transform -translate-x-full transition-transform duration-200 ease-in-out md:translate-x-0 z-50"
        )}
      >
        {/* Close button - visible only on mobile */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 p-1 rounded-md md:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center  border-b px-6 h-16">
          <Logo />
        </div>

        {/* Sidebar Links */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
                  location.pathname === item.path &&
                    "bg-primary/10 text-primary font-medium"
                )}
                onClick={() => {
                  // Close sidebar on mobile when a link is clicked
                  if (window.innerWidth < 768) {
                    toggleSidebar();
                  }
                }}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </ScrollArea>

        {/* Chat with Doctor */}
        <div className="border-t p-4">
          <Button asChild className="w-full" variant="outline">
            <Link
              to="/chat"
              className="flex items-center gap-2 hover:bg-primary"
            >
              <MessageSquare className="h-4 w-4" />
              Chat with Doctor
            </Link>
          </Button>
        </div>
      </div>

      {/* Overlay for mobile - appears when sidebar is open */}
      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-md dark:text-white md:hidden"
        style={{
          visibility: isOpen === true ? "hidden" : "visible",
        }}
      >
        <Menu className="size-5" />
      </button>
    </>
  );
}
