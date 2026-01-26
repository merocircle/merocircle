import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/supabase-auth-context";
import { QueryProvider } from "@/contexts/query-provider";
import { StreamChatProvider } from "@/contexts/stream-chat-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppBackground } from "@/components/ui/app-background";
import { PageLoadingBar } from "@/components/common/PageLoadingBar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "MeroCircle - Support Local Creators",
  description: "The leading platform for supporting and discovering amazing creators from Nepal. Join our community and help build the creator economy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} font-sans antialiased`} suppressHydrationWarning>
        <ErrorBoundary>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
      >
          <QueryProvider>
          <AuthProvider>
            <StreamChatProvider>
              <PageLoadingBar />
              <AppBackground>
                {children}
              </AppBackground>
            </StreamChatProvider>
          </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
