import React, { useState } from 'react';
import type { Channel } from '../../pages/app/Dashboard';
import { useDashboard } from '../../context/DashboardContext';
import { BsHash, BsPlus } from 'react-icons/bs';
import { CreateChannelDialog } from './dialogs/CreateChannelDialog';
import { ProjectInfo } from './ProjectInfo';

type ChannelBarProps = {
    channels: Channel[];
}

export const ChannelBar: React.FC<ChannelBarProps> = ({ channels }) => {
    const { selectedProject, selectedChannel, setSelectedChannel, projects } = useDashboard();
    const [open, setOpen] = useState(false);

    if (projects.length === 0 || selectedProject == null) {
        return null;
    }

    return (
        <div className="w-[240px] md:w-[260px] lg:w-[280px] flex-shrink-0   overflow-y-auto
             bg-[var(--dark-bg)] border-r border-gray-700">
            <ProjectInfo />
            
            <div className="space-y-2 px-4 py-4">
                <ChannelItem
                    key={"all-channels"}
                    channel={{ _id: "", name: "all-channels", projectId: selectedProject?._id } as Channel}
                    isSelected={selectedChannel?._id === ""}
                    onSelect={setSelectedChannel}
                />
            </div>
            
            <ChannelBlock setOpen={setOpen} />
            <div className="space-y-2 px-4">
                {channels
                    .filter((channel) => channel.projectId === selectedProject?._id)
                    .map((channel) => (
                        <ChannelItem
                            key={channel._id}
                            channel={channel}
                            isSelected={selectedChannel?._id === channel._id}
                            onSelect={setSelectedChannel}
                        />
                    ))}
            </div>
            <CreateChannelDialog open={open} setOpen={setOpen} />
        </div >
    );
};

const ChannelItem = ({ channel, isSelected, onSelect }:
    { channel: Channel, isSelected: boolean, onSelect: (channel: Channel) => void }) => (
    <div
        key={channel._id}
        onClick={() => onSelect(channel)}
        className={`w-full px-3 py-2 text-left rounded-2xl transition-all duration-200 
            ${isSelected
                ? 'bg-[var(--dark-secondary)] text-white cursor-pointer shadow-sm'
                : 'hover:bg-gray-700 text-gray-200 cursor-pointer'
            }`}
    >
        <div className='flex items-center space-x-2'>
            <BsHash size='20' className='bg-inherit text-sm' /> <span className='font-mono mt-1 text-sm'>{channel.name}</span>
        </div>  
    </div>

);

const ChannelBlock = ({ setOpen }: { setOpen: (open: boolean) => void }) => (
    <div className='channel-block px-4 py-3 flex items-center justify-between'>
        <div className='text-md  text-gray-400 mr-auto my-auto align-middle  '>Channels</div>
        <button
            className='p-1 hover:bg-gray-700 rounded transition-colors duration-200 cursor-pointer'
            onClick={() => { setOpen(true); }}
        >
            <BsPlus size="20" className="text-gray-400" />
        </button>

    </div>
);

// const Divider = () => <hr className="sidebar-hr border-gray-700 mx-0 border-1" />;