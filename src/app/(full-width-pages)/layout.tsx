import { ThemeProvider } from "@/context/ThemeContext";

export default function FullWidthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div>{children}</div>
    </ThemeProvider>
  );
}
