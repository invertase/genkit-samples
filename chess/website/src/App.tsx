import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Board from "./components/Board";
import RainEffect from "./components/Background";
import { Header } from "./components/Header";
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RainEffect />
      <Header />
      <div className="flex w-screen h-screen justify-center items-start pt-[10vh] md:pt-0">
        <div className="m-4 md:m-24 relative max-w-[90%] max-h-[90%] w-[90vw] md:w-[40vw] md:h-[40vh]">
          <Board />
        </div>
      </div>
    </QueryClientProvider>
  );
}
