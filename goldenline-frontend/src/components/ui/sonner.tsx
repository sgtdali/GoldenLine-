"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const useOptionalTheme = () => {
  try {
    return useTheme();
  } catch {
    return null;
  }
};

const Toaster = ({ ...props }: ToasterProps) => {
  const themeContext = useOptionalTheme();
  const theme = (themeContext?.theme as ToasterProps["theme"]) ?? "system";

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
