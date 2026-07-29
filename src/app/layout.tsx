import type { Metadata } from "next";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import RegisterSW from "@/components/RegisterSW";
import InstallPrompt from "@/components/InstallPrompt";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: { default: settings.site_title, template: `%s | ${settings.site_title}` },
    description: settings.site_description,
    verification: {
      google: "71BnNKBnW4T7pYc_FicoPQCZcskgTA9EcoU3OGZhde4",
    },
  };
}

// Runs before paint to avoid a light->dark flash on load.
const THEME_INIT_SCRIPT = `
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="theme-color" content="#6D28D9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <RegisterSW />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
