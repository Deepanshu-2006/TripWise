import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import ClerkOfflineProvider from './components/ClerkOfflineProvider';

export const metadata = {
  title: "TripWise AI Planner",
  description: "AI-powered travel planner",
};

import SmoothScroll from "./components/SmoothScroll";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";
import OfflineBanner from "./components/OfflineBanner";
import CustomCursor from "./components/CustomCursor";

export default function RootLayout({ children }) {
  return (
    <ClerkOfflineProvider>
      <html
        lang="en"
        className={`${fraunces.variable} ${inter.variable} antialiased`}
      >
        <body className="flex flex-col min-h-screen">
          <CustomCursor />
          <ServiceWorkerRegistrar />
          <OfflineBanner />
          <SmoothScroll>
            {children}
          </SmoothScroll>
        </body>
      </html>
    </ClerkOfflineProvider>
  );
}
