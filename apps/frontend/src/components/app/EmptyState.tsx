import React, { useState } from 'react';
import { BsLightbulb, BsPlus } from 'react-icons/bs';
import { CreateProjectDialog } from './dialogs/CreateProjectDialog';
import { CreateChannelDialog } from './dialogs/CreateChannelDialog';



const EmptyState: React.FC<{ message: string, subMessage: string, cta: string }> = ({ message, subMessage, cta }) => {
    const [openCreateGame, setOpenCreateGame] = useState(false);
    const [openCreateChannel, setOpenCreateChannel] = useState(false);

    return (
        <div className="h-full w-full flex items-center justify-center overflow-hidden">
            <div className="text-center max-w-sm mx-auto px-4">
                <BsLightbulb className="mx-auto size-12 text-[var(--dark-orange-accent)]" />
                <h2 className="mt-2 text-lg font-semibold text-white">{message}</h2>
                <p className="mt-1 text-gray-400">{subMessage}</p>

                {cta === "channel" && <div className="mt-6">
                    <button
                        onClick={() => setOpenCreateChannel(true)}
                        type="button"
                        className="inline-flex items-center rounded-md bg-green-600 
                            px-3 py-2 text-sm font-semibold text-white
                            hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2
                            focus-visible:outline-green-500"
                    >
                        <BsPlus aria-hidden="true" className="mr-1.5 -ml-0.5 size-5" />
                        New Channel
                    </button>
                </div>}

                {cta === "project" && <div className="mt-6">
                    <button
                        onClick={() => setOpenCreateGame(true)}
                        type="button"
                        className="main-button"
                    >
                        <BsPlus aria-hidden="true" className="mr-1.5 -ml-0.5 size-5" />
                        New Project
                    </button>
                </div>}
            </div>
            <CreateProjectDialog open={openCreateGame} setOpen={setOpenCreateGame} />
            <CreateChannelDialog open={openCreateChannel} setOpen={setOpenCreateChannel} />
        </div>
    );
};

export default EmptyState;