import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/settings";

// Content lives in D1 and can change any time from the admin panel, so
// this whole route group is rendered per-request rather than baked in at
// build time.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <Header siteTitle={settings.site_title} />
      <div className="max-w-4xl mx-auto px-4">{children}</div>
      <Footer />
    </>
  );
}
