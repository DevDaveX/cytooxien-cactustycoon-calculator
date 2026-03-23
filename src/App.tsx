import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminPanel from "./pages/AdminPanel";
import AuthCallback from "./pages/AuthCallback";
import Calculator from "./pages/Calculator";
import ChangelogPage from "./pages/ChangelogPage";
import FeedbackPage from "./pages/FeedbackPage";
import FeedbackTracker from "./pages/FeedbackTracker";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Calculator />} />
          <Route path="/rechner" element={<Calculator />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/feedback/:feedbackId" element={<FeedbackTracker />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
