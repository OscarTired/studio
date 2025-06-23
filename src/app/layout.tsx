import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarRail, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import Link from 'next/link';
import { Leaf, BookOpenText, CloudSun, Home } from 'lucide-react';
import Image from 'next/image';
import { UserBar } from '@/components/auth/UserBar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AgriVision',
  description: 'Smart Farming Solutions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SidebarProvider defaultOpen={true}>
          <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="p-4 items-center">
              <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <Image src="/agrivision-logo.svg" alt="AgriVision Logo" width={32} height={32} data-ai-hint="logo agriculture" />
                <h1 className="text-2xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">AgriVision</h1>
              </Link>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Diagnose Crop">
                    <Link href="/">
                      <Leaf />
                      <span>Diagnose Crop</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {/* <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Farm Log">
                    <Link href="/farm-log">
                      <BookOpenText />
                      <span>Farm Log</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem> */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Weather">
                    <Link href="/weather">
                      <CloudSun />
                      <span>Weather</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4">
              <p className="text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">© 2025 AgriVision</p>
            </SidebarFooter>
          </Sidebar>
          <SidebarRail />
          <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:h-16 sm:px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <h1 className="text-xl font-semibold">Dashboard</h1>
              </div>
              <UserBar />
            </header>
            <main className="flex-1 p-4 sm:p-6 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
