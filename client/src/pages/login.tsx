import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/authContext";
import LoginForm from "@/components/auth/LoginForm";

export default function Login() {
  const { user, loading } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1F2C]">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 mx-auto mb-4 text-[#0EA5E9]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1A1F2C 0%, #2A3042 100%)",
      }}
    >
      {/* 3D Background Elements */}
      <div className="absolute inset-0 z-0">
        {/* Large gradient orbs for ambient lighting */}
        <div 
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-[#0EA5E9] opacity-[0.03] blur-[120px]"
          style={{
            animation: "slow-pulse 15s ease-in-out infinite alternate"
          }}
        ></div>
        <div 
          className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] rounded-full bg-[#8B5CF6] opacity-[0.04] blur-[150px]"
          style={{
            animation: "slow-pulse 20s ease-in-out 2s infinite alternate"
          }}
        ></div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white rounded-full opacity-[0.03]"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float-element ${Math.random() * 20 + 15}s linear ${Math.random() * 10}s infinite`,
              transform: `translateY(0px) rotate(${Math.random() * 360}deg)`,
            }}
          ></div>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative z-10">
        <LoginForm />
      </div>
      
      {/* Footer */}
      <footer className="p-4 text-center text-xs text-gray-400 relative z-10">
        <div className="flex items-center justify-center space-x-1 md:space-x-2">
          <span>End-to-end encrypted</span>
          <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
          <span>Secure audio isolation</span>
          <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
          <span>Professional voice platform</span>
        </div>
      </footer>
      
      {/* Animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slow-pulse {
          0% { opacity: 0.02; transform: scale(1); }
          100% { opacity: 0.07; transform: scale(1.2); }
        }
        @keyframes float-element {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-400px) rotate(180deg); }
          100% { transform: translateY(-800px) rotate(360deg); }
        }
      `}} />
    </div>
  );
}
