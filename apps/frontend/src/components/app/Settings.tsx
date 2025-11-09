import React, { useState } from "react";
import { useNotification } from "../../context/NotificationContext";
import { BsArrowLeft } from "react-icons/bs";

export const Settings: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { showNotification } = useNotification();

  const saveApiKey = async (key: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/settings/api-key`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiKey: key }),
        }
      );

      if (!response.ok) {
        showNotification("Failed to save API key", "error");
        return false;
      }

      showNotification("API key saved successfully!", "success");
      return true;
    } catch (err) {
      showNotification("Failed to save API key", "error");
      return false;
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError("API key is required");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await saveApiKey(apiKey.trim());
      setApiKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-y-auto bg-[var(--dark-bg)] p-5">
      <button
        onClick={onBack}
        className="text-white/80 hover:text-white transition-colors font-bold cursor-pointer"
      >
        <BsArrowLeft size="25" />
      </button>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage your settings and API access.
        </p>
      </div>

      <div className="mt-10 max-w-xl rounded-3xl border border-white/10 bg-white/5 px-8 py-10">
        <h2 className="text-lg font-semibold text-white">API Access</h2>
        <p className="mt-1 text-sm text-gray-400">
          Secure your integrations by updating the API key used by your
          channels.
        </p>

        <label
          className="mt-6 block text-sm font-medium text-gray-200"
          htmlFor="api-key"
        >
          API key
        </label>
        <input
          autoComplete="off"
          id="api-key"
          name="api-key"
          type="text"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          className="mt-2 block w-full rounded-2xl bg-white/5 px-3 py-3 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-[var(--dark-orange-accent)]"
          placeholder="Enter your new API key"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        <div className="mt-8 flex items-center gap-3">
          
          <button
            type="button"
            onClick={handleSaveApiKey}
            disabled={isSaving}
            className="main-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save API key"}
          </button>
        </div>
      </div>
    </div>
  );
};
