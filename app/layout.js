import { Inter } from "next/font/google";

import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });
export const metadata = {
  title: "Wealth",
  description: "One Step Finance Platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          {/* header  */}
          <Header />

          <main className="min-h-screen">{children}</main>

          {/* footer  */}
          <footer className=" bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>© 2025 Wealth. All rights reserved.</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
