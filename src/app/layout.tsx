import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { NanoMQProvider } from '@/context/NanoMQContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata = {
  title: 'NanoMQ Dashboard',
  description: 'A comprehensive dashboard for NanoMQ MQTT broker management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              <NanoMQProvider>
                {children}
              </NanoMQProvider>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
