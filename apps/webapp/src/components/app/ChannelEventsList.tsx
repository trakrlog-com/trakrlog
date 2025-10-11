import React from 'react';
import type { Event } from '../../pages/app/Dashboard';
import { BsSearch } from 'react-icons/bs';
import { EventItem } from './EventItem';
import { useDashboard } from '../../context/DashboardContext';
import { EventDetails } from './EventDetails';
import AnimatedListItem from './AnimatedListItem';
import { motion } from 'framer-motion';
import EmptyState from './EmptyState';


export const ChannelEventsList: React.FC<{ events: Event[] }> = ({ events }) => {
    const { selectedEvent } = useDashboard();

    return (
        <div className="flex-1 flex flex-col h-full bg-[var(--dark-bg)] overflow-x-hidden no-scrollbar">

            {selectedEvent == null ? (
                <>
                    <EventsSearch />
                    <EventsList events={events} />
                </>)
                :
                (<EventDetails />)}

        </div>
    );
};

const EventsList = ({ events }: { events: Event[] }) => {

    if (events.length === 0) {
        return (
            <div className='flex flex-col items-center justify-center h-full'>
                <EmptyState
                    message="No events found"
                    subMessage="There are no events for the selected project and channel."
                    cta=""
                />
            </div>
        );
    }

    return (
        <motion.ul className='  justify-center max-w-xl items-center mt-4 px-4  '>

            {events.map((event) => (
                <AnimatedListItem key={event._id} >
                    <EventItem eventData={event} />
                </AnimatedListItem>
            ))}

        </motion.ul>
    );
}
 

const EventsSearch = () => {
    return (
        <div className=' items-center bg-[var(--dark-bg)] max-w-xl'>
            <div className="  bg-[var(--dark-secondary)] rounded-2xl  m-4 ">
                <form action="#" method="GET" className="relative">
                    <input
                        name="search"
                        placeholder="Search events..."
                        aria-label="Search"
                        autoComplete="off"
                        className="w-full rounded-2xl outline-1 outline-white/10 bg-transparent pl-10 pr-4 py-2 text-md text-white 
                                           focus:border-[var(--dark-orange-accent)]/50  
                                         placeholder:text-gray-500 placeholder:text-md"
                    />
                    <BsSearch
                        aria-hidden="true"
                        className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500"
                    />
                </form>
            </div>
        </div>
    );
}