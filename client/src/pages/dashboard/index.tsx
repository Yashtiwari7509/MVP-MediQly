import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/provider/AuthProvider";

const Index = () => {
  const { currentUser, currentDoctor } = useAuth();
  const userName =
    currentUser?.firstName || currentDoctor?.firstName || "Guest";

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto animate-in fade-in duration-700"></div>
    </MainLayout>
  );
};

export default Index;
