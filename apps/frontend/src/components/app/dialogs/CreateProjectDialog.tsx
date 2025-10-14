import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import React, { useState } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import { BsPalette } from 'react-icons/bs';

export const CreateProjectDialog: React.FC<{
    open: boolean,
    setOpen: (open: boolean) => void
}> = ({ open, setOpen }) => {
    const [projectName, setProjectName] = useState('');
    const [projectLogoBase64, setProjectLogoBase64] = useState<string | ArrayBuffer | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showNotification } = useNotification();

    const getBase64 = (file: File, cb: (base64: string | ArrayBuffer | null) => void) => {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            cb(reader.result)
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            var file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB
                setError('File size exceeds 2MB limit');
                return;
            }
            getBase64(file, (b64) => {
                setProjectLogoBase64(b64);
            });
        }
    }



    const addProject = async (name: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, logoBase64: projectLogoBase64 })
            });

            if (!response.ok) {
                showNotification('Failed to add project', 'error');
                return false;
            }

            showNotification(`${name} added successfully!`, 'success');
            return true;
        } catch (err) {
            showNotification('Failed to add project', 'error');
            return false;
        }
    };

    const handleAddproject = async () => {
        if (!projectName.trim()) {
            setError('project name is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await addProject(projectName.trim());
            setProjectName('');
            setOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create project');
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
                        className="relative transform overflow-hidden rounded-3xl bg-[var(--dark-bg)] px-4 pt-5 
                                pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 
                                data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out 
                                data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full 
                                sm:max-w-sm sm:p-6 data-closed:sm:translate-y-0 
                                data-closed:sm:scale-95 outline -outline-offset-1 outline-white/10"
                    >
                        <DialogTitle className="text-lg font-bold text-white">Add project</DialogTitle>

                        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                            <div>
                                <label htmlFor="email" className="block text-sm/6 font-medium text-gray-100">
                                    Project name
                                </label>
                                <div className="mt-2">
                                    <input
                                        autoComplete='off'
                                        id="project-name"
                                        name="project-name"
                                        type="text"
                                        required
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="block w-full rounded-2xl bg-white/5 px-3 py-3 
                                                text-md text-white outline-1 -outline-offset-1
                                                outline-white/10 placeholder:text-gray-500 focus:outline-2 
                                                focus:-outline-offset-2 focus:outline-[var(--dark-orange-accent)]"
                                        placeholder="Enter project name"
                                    />
                                    {error && (
                                        <p className="mt-2 text-sm text-red-500">{error}</p>
                                    )}
                                </div>
                            </div>

                            <div className="col-span-full mt-5">
                                <label htmlFor="cover-photo" className="block text-sm/6 font-medium text-white">
                                    Project logo
                                </label>
                                <div className="mt-2 flex justify-center rounded-2xl border border-dashed border-white/25 px-6 py-10">
                                    <div className="text-center">
                                        <BsPalette aria-hidden="true" className="mx-auto size-12 text-gray-600" />
                                        <div className="mt-4 flex text-sm/6 text-gray-400">
                                            <label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer rounded-md bg-transparent 
                                                font-semibold text-[var(--dark-orange-accent)] focus-within:outline-2 
                                                focus-within:outline-offset-2 focus-within:outline-[var(--dark-orange-accent)]
                                                hover:text-[var(--dark-orange-accent)]/40"
                                            >
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs/5 text-gray-400">PNG, JPG up to 2MB</p>
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
                                    onClick={handleAddproject}
                                    disabled={isLoading}
                                    className="inline-flex w-full justify-center main-button"
                                >
                                    {isLoading ? 'Adding...' : 'Add project'}
                                </button>

                            </div>
                        </div>

                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
};