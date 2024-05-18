import { Invertase } from "./Invertase";

export const Header = () => (
  <header className="fixed top-0 w-full z-10 flex justify-between items-center px-4 py-4 md:justify-start md:gap-2 md:px-24 opacity-80">
    <Logo />
    <h1 className="text-lg font-bold text-white">genkit-chess</h1>
  </header>
);

const Logo = () => (
  <a
    href="https://www.invertase.io"
    className="flex items-center space-x-2 md:space-x-4"
  >
    <div className="w-6 md:w-8">
      <Invertase />
    </div>
    <span className="bg-white bg-clip-text text-transparent uppercase text-lg font-bold tracking-wide md:text-xl">
      Invertase
    </span>
  </a>
);
