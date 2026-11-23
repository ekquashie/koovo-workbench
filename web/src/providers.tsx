import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { createQueryClient } from "@/lib/query-client";

const Providers = ({ children }: { children: ReactNode }) => {
  // One client per app mount (useState keeps it stable across re-renders).
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <Toaster richColors position="top-right" />
      {children}
    </QueryClientProvider>
  );
};

export default Providers;
