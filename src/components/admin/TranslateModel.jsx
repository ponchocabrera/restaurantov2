import { useState } from "react";

export default function TranslateModal({ isOpen, onClose }) {
  const [translations, setTranslations] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    const enContent = {
      heroTitle: "Learn about your Restaurant",
      heroSubtitle: "Your Restaurant, its area and new food trends",
      heroDescription:
        "Understand the food business industry around your Area, find trends and understand how to grow your business.",
      ctaButton: "Get Started Now"
      // Add more key/value pairs as needed
    };

    setLoading(true);
    const translatedContent = {};
    const keys = Object.keys(enContent);

    for (let key of keys) {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: enContent[key], target: "es" })
        });
        const data = await res.json();
        translatedContent[key] = data.translation;
      } catch (error) {
        console.error(`Error translating ${key}:`, error);
        translatedContent[key] = "";
      }
    }

    setTranslations(translatedContent);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded-lg max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">Translate Site to Spanish</h2>
        <button
          onClick={handleTranslate}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
          disabled={loading}
        >
          {loading ? "Translating..." : "Translate"}
        </button>
        {translations && (
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(translations, null, 2)}
          </pre>
        )}
        <button onClick={onClose} className="mt-4 text-gray-700 underline">
          Close
        </button>
      </div>
    </div>
  );
}
