import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import React, { useState } from 'react';
import { useDashboard } from '../../../context/DashboardContext';
import { useNotification } from '../../../context/NotificationContext';

export const CreateChannelDialog: React.FC<{
    open: boolean,
    setOpen: (open: boolean) => void
}> = ({ open, setOpen }) => {
    const { selectedProject, setChannelOrProjectUpdateToggle, channelsOrProjectsUpdateToggle } = useDashboard();
    const [channelName, setChannelName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showNotification } = useNotification();

    const addChannel = async (name: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/projects/${selectedProject?.id}/channels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name })
            });

            if (!response.ok) {
                showNotification('Failed to add channel', 'error', 'Unable to create new channel');
                return false;
            }

            showNotification(`Channel ${name} added successfully!`, 'success', 'Channel created');
            setChannelOrProjectUpdateToggle(!channelsOrProjectsUpdateToggle);
            return true;
        } catch (err) {
            showNotification('Failed to add channel', 'error', 'Unable to create new channel');
            return false;
        }
    };

    const handleAddChannel = async () => {
        if (!channelName.trim()) {
            setError('Channel name is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await addChannel(channelName.trim());
            setChannelName('');
            setOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create channel');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onClose={setOpen} className="relative z-10">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-[var(--dialog-dark-backdrop-bg)] transition-opacity 
                    data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out 
                    data-leave:duration-200 data-leave:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-3xl bg-[var(--dark-bg)] px-4 pt-5 pb-4 
                            text-left shadow-xl transition-all data-closed:translate-y-4 
                            data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out 
                            data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full 
                            sm:max-w-sm sm:p-6 data-closed:sm:translate-y-0 
                            data-closed:sm:scale-95 outline -outline-offset-1 outline-white/10"
                    >
                        <DialogTitle className="text-lg font-bold text-white">Add channel</DialogTitle>

                        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                            <div>
                                <label htmlFor="email" className="block text-sm/6 font-medium text-gray-100">
                                    Channel name
                                </label>
                                <div className="mt-2">
                                    <input
                                        autoComplete='off'
                                        id="game-name"
                                        name="game-name"
                                        type="text"
                                        required
                                        value={channelName}
                                        onChange={(e) => setChannelName(e.target.value)}
                                        className="block w-full rounded-2xl bg-white/5 px-3 py-3 text-md text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-[var(--dark-orange-accent)] sm:text-sm/6"
                                        placeholder="Enter channel name"
                                    />
                                    {error && (
                                        <p className="mt-2 text-sm text-red-500">{error}</p>
                                    )}
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
                                    onClick={handleAddChannel}
                                    disabled={isLoading}
                                    className="inline-flex w-full justify-center main-button"
                                >
                                    {isLoading ? 'Adding...' : 'Add channel'}
                                </button>

                            </div>
                        </div>

                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
};