import { useHealthQuery } from "@/integration";

/** Placeholder shell; the review workbench replaces this in later steps. */
const App = () => {
  const { data, isLoading, isError } = useHealthQuery();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Koovo Review Workbench</h1>
      <p className="mt-2 text-sm text-slate-600">
        API status:{" "}
        {isLoading ? "checking…" : isError ? "unreachable" : data?.status}
      </p>
    </main>
  );
};

export default App;
