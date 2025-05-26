import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/authContext";
import onraLogo from "../../assets/onra-logo-new.png";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const { login } = useAuth();
  
  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true);
    try {
      // Use the auth context login function instead of direct API call
      const user = await login(values.username, values.password);
      console.log("Login successful:", user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.fullName}!`,
      });

      // Add a small delay to ensure toast is shown before redirect
      setTimeout(() => {
        // Redirect based on role
        if (user.role === "admin") {
          console.log("Redirecting to admin dashboard");
          navigate("/admin");
        } else {
          console.log("Redirecting to user dashboard");
          navigate("/user");
        }
      }, 500);
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use a 3D perspective effect when component mounts
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const loginCard = document.getElementById('login-card');
      if (loginCard) {
        const rect = loginCard.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        
        loginCard.style.transform = 
          `perspective(1000px) 
           rotateY(${x * 5}deg) 
           rotateX(${-y * 5}deg)
           translateZ(10px)`;
      }
    };
    
    const resetTransform = () => {
      const loginCard = document.getElementById('login-card');
      if (loginCard) {
        loginCard.style.transform = `
          perspective(1000px) 
          rotateX(2deg) 
          rotateY(0)
          translateZ(0)`;
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', resetTransform);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', resetTransform);
    };
  }, []);

  return (
    <div 
      id="login-card"
      className="w-full max-w-md space-y-6 md:space-y-8 bg-gradient-to-b from-[#2A3042] to-[#1A1F2C] p-6 md:p-8 rounded-xl relative overflow-hidden"
      style={{
        boxShadow: "0 20px 25px -5px rgba(14, 165, 233, 0.4), 0 10px 10px -5px rgba(139, 92, 246, 0.3)",
        transform: "perspective(1000px) rotateX(2deg)",
        backfaceVisibility: "hidden",
        transformStyle: "preserve-3d",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        borderTop: "1px solid rgba(255, 255, 255, 0.15)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
      }}
    >
      {/* Glowing orbs for 3D effect */}
      <div 
        className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-[#0EA5E9] blur-[80px] opacity-20"
        style={{ zIndex: 0 }}
      ></div>
      <div 
        className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-[#8B5CF6] blur-[80px] opacity-20"
        style={{ zIndex: 0 }}
      ></div>
      
      <div className="text-center relative z-10">
        <div 
          className="flex justify-center mb-6 transform hover:scale-105 transition-transform duration-300"
          style={{ 
            filter: "drop-shadow(0 0 15px rgba(14, 165, 233, 0.5))",
            animation: "float 6s ease-in-out infinite"
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
              100% { transform: translateY(0px); }
            }
            @keyframes pulse {
              0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
              70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(14, 165, 233, 0); }
              100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
            }
          `}} />
          <img 
            src={onraLogo} 
            alt="Onra Voice Logo" 
            className="h-32 w-auto" 
            style={{
              filter: "drop-shadow(0 0 20px rgba(14, 165, 233, 0.5))",
              transition: "all 0.3s ease",
            }}
          />
        </div>
        <h1 
          className="text-3xl md:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6]"
          style={{
            textShadow: "0 2px 10px rgba(14, 165, 233, 0.3)",
            transform: "translateZ(20px)",
          }}
        >
          Onra Voice
        </h1>
        <p 
          className="text-gray-300 mb-8 md:mb-10 text-lg"
          style={{
            textShadow: "0 2px 5px rgba(0, 0, 0, 0.3)",
            transform: "translateZ(10px)",
            fontWeight: 300,
          }}
        >
          Secure Virtual Conference
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 md:space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm md:text-base">Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your username"
                    {...field}
                    className="bg-[#374151] border-gray-600 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] text-white h-12 md:h-14 text-base rounded-lg"
                    style={{
                      boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(255, 255, 255, 0.1)",
                      transform: "translateZ(5px)",
                      transition: "all 0.2s ease",
                    }}
                    disabled={isLoading}
                    autoComplete="username"
                    autoCapitalize="none"
                  />
                </FormControl>
                <FormMessage className="text-xs md:text-sm" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm md:text-base">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                    className="bg-[#374151] border-gray-600 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] text-white h-12 md:h-14 text-base rounded-lg"
                    style={{
                      boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(255, 255, 255, 0.1)",
                      transform: "translateZ(5px)",
                      transition: "all 0.2s ease",
                    }}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </FormControl>
                <FormMessage className="text-xs md:text-sm" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6] hover:from-[#0284C7] hover:to-[#7C3AED] text-white h-14 md:h-16 mt-8 text-base md:text-lg font-medium relative overflow-hidden rounded-xl"
            style={{
              transform: "translateY(0) translateZ(15px)",
              transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              boxShadow: "0 10px 20px -5px rgba(14, 165, 233, 0.5), 0 8px 16px -8px rgba(139, 92, 246, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              textShadow: "0 1px 1px rgba(0, 0, 0, 0.3)",
              letterSpacing: "0.5px"
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(4px) translateZ(5px) scale(0.98)";
              e.currentTarget.style.boxShadow = "0 5px 10px -5px rgba(14, 165, 233, 0.3), 0 4px 8px -4px rgba(139, 92, 246, 0.3)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(0) translateZ(15px) scale(1)";
              e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(14, 165, 233, 0.5), 0 8px 16px -8px rgba(139, 92, 246, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) translateZ(15px) scale(1)";
              e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(14, 165, 233, 0.5), 0 8px 16px -8px rgba(139, 92, 246, 0.5)";
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
          
          <div className="text-center text-xs md:text-sm text-gray-400 mt-3 md:mt-4">
            For hisab melane ke Liye (account settlement): +91-XXXXXXXXXX
          </div>
        </form>
      </Form>
    </div>
  );
}
