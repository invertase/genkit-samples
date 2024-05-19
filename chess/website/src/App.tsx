import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Board from "./components/chessboard/ChessboardContainer";
import RainEffect from "./components/Background";
import { Header } from "./components/Header";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RainEffect />
      <Header />
      <Board />
    </QueryClientProvider>
  );
}
