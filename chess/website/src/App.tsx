import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Board from "./components/Board";
import RainEffect from "./components/Background";
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RainEffect />

      <div className="flex w-screen h-screen justify-center items-center md:items-start">
        <div className=" m-4 md:m-24 relative max-w-full max-h-full w-[90vw] md:w-[40vw] md:h-[40vh]">
          <Board />
        </div>
      </div>
    </QueryClientProvider>
  );
}
