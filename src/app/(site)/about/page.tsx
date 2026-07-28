import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <div className="py-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">درباره من</h1>
      <div className="whitespace-pre-wrap opacity-90 leading-relaxed">{settings.about_content}</div>
    </div>
  );
}
