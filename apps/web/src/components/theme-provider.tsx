import { createContext, type ReactNode, useContext, useEffect } from "react";

import { readSuiteTheme } from "../lib/suite";

type Theme = "light" | "dark";

// The theme is a suite-wide preference chosen in the RG360 landing.
const ThemeContext = createContext<{ theme: Theme }>({ theme: "light" });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = readSuiteTheme();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
