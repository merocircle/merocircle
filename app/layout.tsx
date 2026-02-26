import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-provider";
import { AuthContextProvider } from "@/contexts/auth-context";
import { QueryProvider } from "@/contexts/query-provider";
import { StreamChatProvider } from "@/contexts/stream-chat-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppBackground } from "@/components/ui/app-background";
import { PageLoadingBar } from "@/components/common/PageLoadingBar";
import { ToastProvider } from "@/contexts/toast-context";
import { Toaster } from "@/components/ui/toaster";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#990000",
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://merocircle.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "MeroCircle - Support Creators in Nepal",
    template: "%s | MeroCircle",
  },
  description:
    "Join the inner circle of Nepal's best creators. Get exclusive posts, private chats, and a real connection. Support the creators who inspire you.",
  keywords: [
    "MeroCircle",
    "Mero Circle",
    "Nepal creators",
    "support creators Nepal",
    "Nepali creator platform",
    "creator economy Nepal",
    "exclusive content Nepal",
    "eSewa creator",
    "Khalti creator",
    "Fonepay creator",
    "Nepali YouTuber support",
    "inner circle",
    "patron Nepal",
    "fan membership Nepal",
  ],
  authors: [{ name: "MeroCircle", url: APP_URL }],
  creator: "MeroCircle",
  publisher: "MeroCircle",
  applicationName: "MeroCircle",
  category: "Creator Economy",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/logo/logo-favicon.svg", type: "image/svg+xml" },
      { url: "/logo/logo-favicon.svg", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/logo/logo-favicon.svg", sizes: "180x180" },
    shortcut: "/logo/logo-favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "MeroCircle",
    title: "MeroCircle - Support Creators in Nepal",
    description:
      "Join the inner circle of Nepal's best creators. Exclusive posts, private chats, and a real connection.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MeroCircle - Support Creators in Nepal",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MeroCircle - Support Creators in Nepal",
    description:
      "Join the inner circle of Nepal's best creators. Exclusive posts, private chats, and a real connection.",
    images: ["/og-image.png"],
    creator: "@merocircle",
    site: "@merocircle",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here when available
    // google: "your-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "MeroCircle",
              url: "https://merocircle.app",
              description:
                "Join the inner circle of Nepal's best creators. Get exclusive posts, private chats, and a real connection.",
              applicationCategory: "SocialNetworkingApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "NPR",
                description: "Free to join as a supporter",
              },
              creator: {
                "@type": "Organization",
                name: "MeroCircle",
                url: "https://merocircle.app",
                logo: "https://merocircle.app/logo/logo.png",
                sameAs: [],
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "150",
                bestRating: "5",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MeroCircle",
              url: "https://merocircle.app",
              logo: "https://merocircle.app/logo/logo.png",
              description:
                "Nepal's platform for creators and supporters to connect directly.",
              foundingDate: "2024",
              foundingLocation: {
                "@type": "Place",
                name: "Kathmandu, Nepal",
              },
              contactPoint: {
                "@type": "ContactPoint",
                email: "team@merocircle.app",
                contactType: "customer support",
              },
            }),
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        {/* DNS prefetch for faster third-party connections */}
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('merocircle-theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    // system or unset: follow OS preference
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.add('light');
                    }
                  }
                } catch (e) {
                  // On error, follow OS preference
                  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.add('light');
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${roboto.variable} font-sans antialiased`} suppressHydrationWarning>
        {/* Load analytics after page is interactive — not render-blocking */}
        <Script
          src="https://t.contentsquare.net/uxa/0a3928cc3193c.js"
          strategy="lazyOnload"
        />
        <ErrorBoundary>
        <ToastProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange
          storageKey="merocircle-theme"
      >
          <QueryProvider>
          <AuthProvider>
            <AuthContextProvider>
              <StreamChatProvider>
                <PageLoadingBar />
                <Toaster />
                <AppBackground>
                  {children}
                </AppBackground>
              </StreamChatProvider>
            </AuthContextProvider>
          </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
