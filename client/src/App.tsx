import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/authContext";
import { RealtimeProvider } from "@/components/RealtimeProvider";
import { WebSocketProvider } from "@/lib/wsContext";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin";
import UserDashboard from "@/pages/user";
import Conference from "@/pages/conference";
import NotFound from "@/pages/not-found";
import DatabaseDiag from "@/pages/database-diag";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/user" component={UserDashboard} />
      <Route path="/conference/:roomId" component={Conference} />
      <Route path="/database-diag" component={DatabaseDiag} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <RealtimeProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </RealtimeProvider>
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
