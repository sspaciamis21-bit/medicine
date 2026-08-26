import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Family Medicine Management & Reminder System",
  description: "Organize family medicines, track stock & expiry, meal-linked reminders, insulin logs, 1-tap pharmacy reorders, and expense tracking.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Family Medicine",
  },
};

export const viewport: Viewport = {
  themeColor: "#10847e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#f4f1eb] text-[#1c2a38] antialiased font-sans flex flex-col justify-between selection:bg-[#10847e] selection:text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
