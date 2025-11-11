import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ProjectsBar } from '../../components/app/ProjectsBar';
import { ChannelBar } from '../../components/app/ChannelBar';
import { ChannelEventsList } from '../../components/app/ChannelEventsList';
import { useDashboard } from '../../context/DashboardContext';
import EmptyState from '../../components/app/EmptyState';
import { Settings } from '../../components/app/Settings/Settings';
import { AtGlance } from '../../components/app/AtGlance';

type DashboardView = 'default' | 'settings' | 'glance';

export type Project = {
    _id: string;
    name: string;
    logoBase64?: string;
}

export type Channel = {
    _id: string;
    name: string;
    projectId: string;
}

export type Event = {
    _id: string;
    channelId: string;
    projectId: string;
    createdAt: string;
    title: string;
    description: string;
    tags: { [key: string]: string };
    icon: string;
}

export const Dashboard: React.FC = () => {
    const { events, projects, channels, setEvents, setProjects, setChannels, selectedChannel, selectedProject, setSelectedProject, setSelectedChannel, setSelectedEvent, channelsOrProjectsUpdateToggle } = useDashboard();
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loadingProjectsAndChannels, setLoadingProjectsChannels] = useState(true);
    const [,setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<DashboardView>('default');
    
    const { projectId, channelId, eventId } = useParams<{ projectId?: string; channelId?: string; eventId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Sync URL params to context state when data is loaded
    useEffect(() => {
        if (loadingProjectsAndChannels) return;

        // Determine active view from URL
        if (location.pathname === '/dashboard/overview') {
            setActiveView('glance');
            return;
        }
        if (location.pathname === '/dashboard/settings') {
            setActiveView('settings');
            return;
        }
        setActiveView('default');

        // Handle project selection from URL
        if (projectId) {
            const project = projects.find(p => p._id === projectId);
            if (project) {
                setSelectedProject(project);
            } else if (projects.length > 0) {
                // Project not found, redirect to base dashboard
                console.warn(`Project ${projectId} not found`);
                navigate('/dashboard', { replace: true });
                return;
            }
        } else {
            setSelectedProject(null);
        }

        // Handle channel selection from URL
        if (channelId && projectId) {
            if (channelId === 'all') {
                setSelectedChannel({ _id: '', name: 'all-channels', projectId } as Channel);
            } else {
                const channel = channels.find(c => c._id === channelId);
                if (channel) {
                    setSelectedChannel(channel);
                } else if (channels.length > 0) {
                    console.warn(`Channel ${channelId} not found`);
                    navigate(`/dashboard/projects/${projectId}`, { replace: true });
                    return;
                }
            }
        } else {
            setSelectedChannel(null);
        }
    }, [projectId, channelId, location.pathname, projects, channels, loadingProjectsAndChannels]);

    // Sync event selection from URL
    useEffect(() => {
        if (loadingEvents) return;

        if (eventId && projectId && channelId) {
            const event = events.find(e => e._id === eventId);
            if (event) {
                setSelectedEvent(event);
            } else if (events.length > 0) {
                console.warn(`Event ${eventId} not found`);
                navigate(`/dashboard/projects/${projectId}/channels/${channelId}`, { replace: true });
            }
        } else {
            setSelectedEvent(null);
        }
    }, [eventId, events, loadingEvents, projectId, channelId]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                if (!selectedProject) {
                    setEvents([]);
                    setLoadingEvents(false);
                    return;
                }

                const channelId = selectedChannel?._id ?? '';
                const projectId = selectedProject._id;
                let url = `${import.meta.env.VITE_BACKEND_URL}/events/project/${projectId}/channel/${channelId}`;
                if (channelId === '') {
                    url = `${import.meta.env.VITE_BACKEND_URL}/events/project/${projectId}`;
                }

                const response = await fetch(url);
                if (!response.ok) {
                    setLoadingEvents(false);
                    throw new Error('Failed to fetch events');
                }
                const { data } = await response.json();
                setEvents(data.events);
                setLoadingEvents(false);
            } catch (err) {
                setError('Failed to fetch events');
                setLoadingEvents(false);
                console.error('Error fetching events:', err);
            }
        };

        fetchEvents();

        const t = setInterval(() => {
            fetchEvents();
        }, 10000);
        return () => clearInterval(t);
        
    }, [selectedChannel, selectedProject]);

    useEffect(() => {
        const fetchProjectsAndChannels = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/projects`);
                const responseChannels = await fetch(`${import.meta.env.VITE_BACKEND_URL}/channels`);

                if (!response.ok || !responseChannels.ok) {
                    setLoadingProjectsChannels(false);
                    throw new Error('Failed to fetch projects or channels');
                }

                const { data } = await response.json();
                const { data: channeldData } = await responseChannels.json();
                setProjects(data.projects);
                setChannels(channeldData.channels);
                setLoadingProjectsChannels(false);
            } catch (err) {
                setError('Failed to fetch projects or channels');
                setLoadingProjectsChannels(false);
                console.error('Error fetching projects or channels:', err);
            }
        };
       fetchProjectsAndChannels();
    }, [channelsOrProjectsUpdateToggle]);

    if (loadingEvents || loadingProjectsAndChannels) {
        return (
            <div className="h-screen w-screen overflow-hidden bg-gray-900 flex items-center justify-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            </div>
        );
    }



    const renderMainContent = () => {
        if (activeView === 'glance') {
            return (
                <div className="flex-1 overflow-y-auto">
                    <AtGlance />
                </div>
            );
        }

        if (activeView === 'settings') {
            return <Settings onBack={() => navigate('/dashboard/overview')} />;
        }

        return (
            <>
                <ChannelBar channels={channels} />
                {projects.length === 0 ? (
                    <EmptyState cta="project" message="No projects found" subMessage="Add a project to get started." />
                ) : selectedProject == null ? (
                    <EmptyState cta="" message="No project selected" subMessage="Select a project to view events." />
                ) : (
                    <ChannelEventsList events={events} />
                )}
            </>
        );
    };

    return (
        <div className="fixed inset-0 min-h-screen w-full bg-[var(--dark-bg)]">
            <div className="h-full mx-auto max-w-4xl  bg-[var(--dark-bg)]">
                <div className="flex h-full">
                    <ProjectsBar
                        projects={projects}
                        onOpenSettings={() => navigate('/dashboard/settings')}
                        onProjectSelected={() => { /* Navigation handled in ProjectsBar */ }}
                        onOpenOverview={() => navigate('/dashboard/overview')}
                        isOverviewActive={activeView === 'glance'}
                    />

                    {renderMainContent()}
                </div>
            </div>
        </div>
    );
};

