import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/supabase-auth-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppBackground } from "@/components/ui/app-background";
import { PageLoadingBar } from "@/components/common/PageLoadingBar";

export const metadata: Metadata = {
  title: "Creators Nepal - Support Local Creators",
  description: "The leading platform for supporting and discovering amazing creators from Nepal. Join our community and help build the creator economy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ErrorBoundary>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
      >
          <AuthProvider>
            <PageLoadingBar />
            <AppBackground>
              {children}
            </AppBackground>
          </AuthProvider>
        </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
