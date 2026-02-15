import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, Roboto} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-provider";
import { AuthContextProvider } from "@/contexts/auth-context";
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

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-roboto",
});


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "MeroCircle - Support Local Creators",
  description: "The leading platform for supporting and discovering amazing creators from Nepal. Join our community and help build the creator economy.",
  icons: {
    icon: "/logo/logo-favicon.svg",
    apple: "/logo/logo-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.className} light`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('merocircle-theme');
                  if (!theme || theme === 'system') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    localStorage.setItem('merocircle-theme', 'light');
                  } else if (theme === 'dark') {
                    document.documentElement.classList.remove('light');
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${roboto.variable} antialiased`} suppressHydrationWarning>
        <ErrorBoundary>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="merocircle-theme"
      >
          <QueryProvider>
          <AuthProvider>
            <AuthContextProvider>
              <StreamChatProvider>
                <PageLoadingBar />
                <AppBackground>
                  {children}
                </AppBackground>
              </StreamChatProvider>
            </AuthContextProvider>
          </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
