import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "VAANI — On-Device Adaptive Voice Isolation for Defence",
  description:
    "Real-time, edge-AI adaptive noise cancellation for mission-critical defence and emergency radio communications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Automatically clean up any stale Service Workers registered on localhost:3000 by other projects */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  for (var r of regs) { r.unregister(); }
                });
              }
            `,
          }}
        />
      </head>
      <body className="bg-vaani-bg text-vaani-text antialiased font-mono selection:bg-vaani-accent selection:text-black">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
