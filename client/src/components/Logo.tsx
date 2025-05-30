import { HeartPulse } from "lucide-react";

const Logo = () => {
  return (
    <div className="relative  z-20 flex items-center gap-[3px] text-lg font-bold">
      <HeartPulse className="h-6 w-6 text-red-600" />
      <span className="primary-grad"> MediQly</span>
    </div>
  );
};

export default Logo;
