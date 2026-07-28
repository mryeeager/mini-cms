"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<any>(null);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setPromptEvent(e);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!promptEvent) return null;

  async function handleInstall() {
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-4 left-4 z-50 px-4 py-2 rounded-full bg-brand text-white text-sm shadow-lg"
    >
      📲 نصب اپلیکیشن
    </button>
  );
}
