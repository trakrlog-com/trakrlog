import React from 'react';
import type { Event } from '../../types/dashboard';
import Twemoji from 'react-twemoji'; 
import { DateTime } from 'luxon';


export const EventItem: React.FC<{ eventData: Event, channelName: string }> = ({ eventData, channelName }) => {

    const [showInlineDetails,  ] = React.useState(false);
    const dateTime = DateTime.fromISO(eventData.createdAt);
    const formattedDate = `${dateTime.toRelativeCalendar()} at ${dateTime.toLocaleString(DateTime.TIME_SIMPLE)}`;

    return (
        <>
            <div className="transition flex space-x-4 rounded-3xl bg-(--dark-secondary) shadow-none 
                                   p-4  w-full"
                >
                <span>
                    {eventData.icon && (
                        <div className='flex items-center justify-center h-6 w-6 rounded-xl  
                                  outline-(--dark-accent) outline-2
                                bg-(--dark-accent)'>
                            <Twemoji options={{ className: 'twemoji h-4 w-4' }}>
                                {eventData.icon}
                            </Twemoji>
                        </div>
                    )}

                </span>
                <div className="flex min-w-0 flex-1 justify-between space-x-4">
                    <div>
                        <p className="text-md text-white ">
                            {eventData.title}
                        </p>
                        <p className=" text-md text-gray-400">
                            <span>{channelName}</span> <span className="text-gray-500 mx-2">•</span> <span>{formattedDate}</span>
                        </p>

                    {showInlineDetails && (<>
                        <p className="text-lg text-gray-400">
                            {eventData.description}
                        </p>
                        <p className='mt-4'>
                            {eventData.tags && Object.entries(eventData.tags).slice(0, 1).map(([key, value]) => (
                                <span key={key} className="mr-2 mb-2 inline-flex items-center rounded-md
                               px-2 py-1 text-md font-medium 
                               inset-ring   bg-gray-400/10
                              text-gray-400 inset-ring-gray-400/20">
                                    <span className='mr-2'>{key}: </span><span className=" text-white">{value}</span>
                                </span>
                            ))}
                        </p>
                        </>)}
                    </div>
                </div>
            </div>
        </>

    );
}; 