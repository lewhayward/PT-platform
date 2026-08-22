import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// An elegant serif for headings only - body text stays on the clean
// sans-serif above. That contrast is most of what makes the app read as
// "premium" rather than just "clean utility app".
const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trainr",
  description: "Workouts, nutrition and progress tracking for trainers and their clients.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    title: "Trainr",
    statusBarStyle: "default",
  },
};

// Locks pinch-zoom off and sets the browser chrome colour - makes the app
// feel more like a native app when added to a phone's home screen.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0e0d0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
