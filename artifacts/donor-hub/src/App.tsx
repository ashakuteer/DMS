import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "./pages/dashboard";
import Donors from "./pages/donors";
import DonorDetail from "./pages/donor-detail";
import Donations from "./pages/donations";
import Beneficiaries from "./pages/beneficiaries";
import Sponsorships from "./pages/sponsorships";
import Reports from "./pages/reports";
import Communications from "./pages/communications";
import TimeMachine from "./pages/time-machine";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/donors" component={Donors} />
      <Route path="/donors/:id" component={DonorDetail} />
      <Route path="/donations" component={Donations} />
      <Route path="/beneficiaries" component={Beneficiaries} />
      <Route path="/sponsorships" component={Sponsorships} />
      <Route path="/reports" component={Reports} />
      <Route path="/communications" component={Communications} />
      <Route path="/time-machine" component={TimeMachine} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
