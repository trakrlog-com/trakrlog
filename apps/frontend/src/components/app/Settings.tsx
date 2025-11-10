import React, { useState } from "react";
import { useNotification } from "../../context/NotificationContext";
import { BsArrowLeft } from "react-icons/bs";
import { HiKey } from "react-icons/hi2";
import { useAppContext } from "../../context/AuthContext";
import { ShowApiKeyDialog } from "./dialogs/ShowApiKey";

export const Settings: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState("");  
  const { showNotification } = useNotification();
  const { authContext } = useAppContext();
  const [open, setOpen] = useState(false);

  const generateApiKey = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/settings/apikey`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        showNotification("Failed to save API key", "error", "Unable to generate new API Key");
        setApiKey("");
        return false;
      }

      const { data } = await response.json();
      console.log("New API Key:", data.settings.apiKey);
      setApiKey(data.settings.apiKey);
      setOpen(true);

      return true;
    } catch (err) {
      showNotification("Failed to save API key", "error", "Unable to generate new API Key");
      setApiKey("");
      return false;
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
        <div className="flex mt-2 gap-3">
          <input
            autoComplete="off"
            id="api-key"
            name="api-key"
            type="text"
            value={authContext.userData?.userData.apiKey}
            className=" block w-full rounded-2xl bg-white/5 px-3 py-3 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-[var(--dark-orange-accent)]"
            placeholder="Generate new API Key"
          />

          <button
            type="button"
            onClick={generateApiKey}
            className="main-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          >
            <HiKey size="20" className="mr-2"/><span>Generate</span>
          </button>
        </div>
      </div>

      <ShowApiKeyDialog open={open} setOpen={setOpen} apiKey={apiKey} />
    </div>
  );
};
