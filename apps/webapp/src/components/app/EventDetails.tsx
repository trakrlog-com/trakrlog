import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { BsArrowLeft } from 'react-icons/bs';

import Twemoji from 'react-twemoji';
import { DateTime } from 'luxon';

export const EventDetails: React.FC = () => {
    const { selectedEvent, setSelectedEvent, projects, channels, } = useDashboard();

    if (selectedEvent === null) {
        return null;
    }

    const handleBack = () => {
        setSelectedEvent(null);
    };

    const dateTime = DateTime.fromISO(selectedEvent.createdAt);
    const formattedDate = `${dateTime.toRelativeCalendar()} at ${dateTime.toLocaleString(DateTime.TIME_SIMPLE)}`;

    return (
        <div>
            <div className="mx-auto p-5 w-full max-w-2xl">


                <div className=" px-6 space-y-6">
                    <button
                        onClick={handleBack}
                        className="text-white/80 hover:text-white transition-colors font-bold"
                    >
                        <BsArrowLeft size="25" />
                    </button>
                    <div className='flex'>
                        <span>
                            {selectedEvent.icon && (
                                <div className='flex items-center justify-center h-16 w-16 rounded-xl  
                                                          outline-[var(--dark-accent)] outline-2
                                                        bg-[var(--dark-accent)]'>
                                    <Twemoji options={{ className: 'twemoji' }}>
                                        {selectedEvent.icon}
                                    </Twemoji>
                                </div>
                            )}

                        </span>
                        <span className='ml-4'>
                            <h3 className="text-xl text-white mb-2">
                                {selectedEvent.title}
                            </h3>
                            {selectedEvent.description && (
                                <p className="text-white mt-2 text-md">
                                    {selectedEvent.description}
                                </p>
                            )}
                        </span>
                    </div> 
                    <div className="mt-6 border-t border-gray-100 dark:border-white/10">
                        <dl className="divide-y divide-gray-100 dark:divide-white/10">

                            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                <dt className="text-base font-medium text-gray-900 dark:text-gray-100">Project</dt>
                                <dd className="mt-1 text-base text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-400 font-mono">
                                    {projects.filter(project => project._id === selectedEvent.projectId)[0]?.name}</dd>
                            </div>
                            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                <dt className="text-base font-medium text-gray-900 dark:text-gray-100">Channel</dt>
                                <dd className="mt-1 text-base text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-400 font-mono">
                                    {channels.filter(channel => channel._id === selectedEvent.channelId)[0]?.name}
                                </dd>
                            </div>
                            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                <dt className="text-base font-medium text-gray-900 dark:text-gray-100">Timestamp</dt>
                                <dd className="mt-1 text-base text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-400 font-mono">{formattedDate}</dd>
                            </div>

                            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                <dt className="text-base font-medium text-gray-900 dark:text-gray-100">Tags</dt>
                                <dd className="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-white">

                                    {selectedEvent.tags ? Object.entries(selectedEvent.tags).map(([key, value]) => (
                                        <span key={key} className="mr-2 mb-2 inline-flex items-center rounded-md
                             bg-gray-50 px-2 py-1 text-md font-medium 
                             text-gray-600 inset-ring inset-ring-gray-500/10 dark:bg-gray-400/10
                              dark:text-gray-400 dark:inset-ring-gray-400/20">
                                            <span className='mr-2'>{key}: </span><span className=" text-gray-900 dark:text-white">{value}</span>
                                        </span>
                                    )
                                    ) : (
                                        <span className="text-gray-600">No tags</span>
                                    )}



                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

        </div>
    );
};
