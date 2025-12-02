import { useNotification } from "../../../context/NotificationContext";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import React from "react";

export const ConfirmApiKeyUpdate: React.FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccessfulUpdate: (apiKey: string) => void;
}> = ({ open, setOpen, onSuccessfulUpdate }) => {
  const { showNotification } = useNotification();

  const generateApiKey = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/settings/apikey`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        showNotification("Failed to save API key", "error", "Unable to generate new API Key");
        return false;
      }

      const { data } = await response.json();
      setOpen(false);
      showNotification(
        "API key generated successfully",
        "success",
        "New API Key has been generated"
      );

      onSuccessfulUpdate(data.settings.apiKey);

      return true;
    } catch (err) {
      showNotification("Failed to save API key", "error", "Unable to generate new API Key");
      return false;
    }
  };

  return (
    <Dialog open={open} onClose={setOpen} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-(--dialog-dark-backdrop-bg) transition-opacity 
                         data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out 
                         data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-3xl bg-(--dark-bg) px-4 pt-5 
                                         pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 
                                         data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out 
                                         data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full 
                                         sm:max-w-sm sm:p-6 data-closed:sm:translate-y-0 
                                         data-closed:sm:scale-95 outline -outline-offset-1 outline-white/10"
          >
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10 dark:bg-red-500/10">
                <ExclamationTriangleIcon
                  aria-hidden="true"
                  className="size-6 text-red-600 dark:text-red-400"
                />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <DialogTitle
                  as="h3"
                  className="text-base font-semibold text-gray-900 dark:text-white"
                >
                  Generate new API Key
                </DialogTitle>
                <div className="mt-2">
                  <p className="text-base text-gray-500 dark:text-gray-400">
                    Are you sure you want to generate a new API Key? This will invalidate your
                    current key and all existing integrations forever. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                data-autofocus
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex w-full justify-center items-center px-3 py-2 cursor-pointer
                                        text-md font-semibold text-gray-400 hover:text-white transition-colors sm:mt-0"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generateApiKey}
                className="inline-flex w-full justify-center main-button"
              >
                Generate Key
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};
