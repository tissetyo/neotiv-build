import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
});

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-staff",
});

export const metadata: Metadata = {
  title: "Neotiv — Hotel Hospitality Platform",
  description: "Interactive TV dashboard platform for hotels",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={`${playfair.variable} ${dmSans.variable} ${ibmPlex.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
