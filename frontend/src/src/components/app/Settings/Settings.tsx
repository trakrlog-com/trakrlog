import React, { useEffect, useState } from "react";
import { BsArrowLeft, BsClipboard } from "react-icons/bs";
import { ConfirmApiKeyUpdate } from "../dialogs/ConfirmApiKeyUpdate";
import { UserProfile } from "./UserProfile";
import { useNotification } from "../../../context/NotificationContext";

export const Settings: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState("");
  const [open, setOpen] = useState(false);
  const { showNotification } = useNotification();

  // create a effect to get the user settings
  useEffect(() => {
    const fetchSettings = async () => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/settings`
      );
      if (response.ok) {
        const data = await response.json();
        setApiKey(data.data.settings.apiKey);
      }
    };
    fetchSettings();
  }, []);

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

      <UserProfile />

      <div className="mt-10 max-w-xl rounded-3xl border border-white/10 bg-white/5 px-8 py-10">
        <h2 className="text-lg font-semibold text-white">API Access</h2>
        <p className="mt-1 text-md text-gray-400">
          <span>Use this API Key in the</span>
          <span
            className="mx-2   inline-flex items-center rounded-md
                               px-2   text-md font-medium 
                               inset-ring bg-gray-400/10
                               text-gray-400 inset-ring-gray-400/20"
          >
            <code>tl-api-key</code>
          </span>

          <span>
            {" "}
            header in your requests. If you believe your API key has been
            compromised, regenerate it immediately.
          </span>
        </p>

        <div className="relative mt-2">
          <input
            autoComplete="off"
            id="api-key"
            name="api-key"
            type="text"
            value={apiKey}
            readOnly
            className="block w-full rounded-2xl bg-white/5 px-3 py-3 pr-12 text-md text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-[var(--dark-orange-accent)]"
            placeholder="Generate new API Key"
          />

          <button
            type="button"
            aria-label="Copy API key"
            onClick={() => {
              navigator.clipboard.writeText(apiKey);
              showNotification("API Key copied to clipboard", "success", "Success");
            }}
            className="absolute inset-y-0 right-0 flex items-center rounded-2xl rounded-l-none bg-white/5 px-3 text-white transition-colors hover:bg-white/10"
          >
            <BsClipboard size="18" />
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="main-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      <ConfirmApiKeyUpdate
        open={open}
        setOpen={setOpen}
        onSuccessfulUpdate={setApiKey}
      />
    </div>
  );
};
