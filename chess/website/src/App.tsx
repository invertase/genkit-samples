import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Board from "./components/Board";
import RainEffect from "./components/Background";
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RainEffect />

      <div className="flex w-[100vw] h-[100vh] justify-center items-center absolute ">
        <div className="fixed w-[30vw] max-h-[50vh]">
          <Board />
        </div>
      </div>
    </QueryClientProvider>
  );
}
