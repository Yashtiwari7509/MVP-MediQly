import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun, LogOut } from "lucide-react";
import { memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Navigation } from "./Navigation";
import { toast } from "sonner";
import { useTheme } from "@/utils/theme.provider";
import { useLogout } from "@/hooks/auth";
import { useAuth } from "@/auth/AuthProvider";
import VoiceNavigation from "../VoiceNavigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();

  const { currentDoctor, currentUser, userType } = useAuth();
  const logoutFun = useLogout();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    logoutFun.mutate(undefined, {
      onSuccess: () => {
        navigate("/login");
        toast.success("You have been successfully logged out");
      },
    });
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Overlay when Sidebar is open on mobile */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-64">
        <div className="border-b w-full fixed right-0 top-0 bg-background z-40">
          <div className="container  flex h-16 items-center px-4">
            <div className="ml-auto  flex items-center gap-4">
              <Button
                className="rounded-full"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
              >
                {theme === "light" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src="https://github.com/shadcn.png"
                        alt="@shadcn"
                      />
                      <AvatarFallback>
                        {userType === "user"
                          ? currentUser?.firstName.charAt(0)
                          : currentDoctor?.firstName.charAt(0)}
                        {userType === "user"
                          ? currentUser?.lastName.charAt(0)
                          : currentDoctor?.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userType === "user"
                          ? currentUser?.firstName
                          : currentDoctor?.firstName}
                        {userType === "user"
                          ? currentUser?.lastName
                          : currentDoctor?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userType === "user"
                          ? currentUser?.email
                          : currentDoctor?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="container mx-auto mt-20 p-6 pb-20 md:pb-6">
          {children}
        </div>
      </main>
      <Navigation />
      <VoiceNavigation />
      {/* <OfflineIndicator /> */}
    </div>
  );
};

export default memo(MainLayout);
