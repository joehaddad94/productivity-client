import type { Metadata } from "next";
import { Providers } from "./providers";
import { Layout } from "./components/Layout";
import "./global.css";

export const metadata: Metadata = {
  title: "Productivity",
  description: "Stay focused. Get things done.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
