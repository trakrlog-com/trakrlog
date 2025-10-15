import React, { createContext, useContext, useState } from 'react';
import type { Channel, Project, Event } from '../pages/app/Dashboard';

type DashboardContextType = {
    selectedProject: Project | null;
    selectedChannel: Channel | null;
    setSelectedProject: (project: Project | null) => void;
    setSelectedChannel: (channel: Channel | null) => void;
    setSelectedEvent: (event: Event | null) => void;
    selectedEvent: Event | null;
    clearSelections: () => void;
    events: Event[];
    projects: Project[];
    channels: Channel[];
    setEvents: (events: Event[]) => void;
    setProjects: (projects: Project[]) => void;
    setChannels: (channels: Channel[]) => void;
    channelsOrProjectsUpdateToggle: boolean;
    setChannelOrProjectUpdateToggle: (updated: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [channelsOrProjectsUpdateToggle, setChannelOrProjectUpdateToggle] = useState(false);
    
    const clearSelections = () => {
        setSelectedProject(null);
        setSelectedChannel(null);
        setSelectedEvent(null);
    };

    const value = {
        selectedProject,
        selectedChannel,
        selectedEvent,
        setSelectedProject,
        setSelectedChannel,
        setSelectedEvent,
        clearSelections,
        events,
        projects,
        channels,
        setEvents,
        setProjects,
        setChannels,
        setChannelOrProjectUpdateToggle,
        channelsOrProjectsUpdateToggle
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}