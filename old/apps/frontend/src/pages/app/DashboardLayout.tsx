import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ProjectsBar } from '../../components/app/ProjectsBar';
import { useDashboard } from '../../context/DashboardContext';

export const DashboardLayout: React.FC = () => {
    const { setProjects, setChannels, channelsOrProjectsUpdateToggle, projects } = useDashboard();
    const [loadingProjectsAndChannels, setLoadingProjectsChannels] = useState(true);
    const [, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Fetch projects and channels once at the layout level
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
                const { data: channelData } = await responseChannels.json();
                setProjects(data.projects);
                setChannels(channelData.channels);
                setLoadingProjectsChannels(false);
            } catch (err) {
                setError('Failed to fetch projects or channels');
                setLoadingProjectsChannels(false);
                console.error('Error fetching projects or channels:', err);
            }
        };
        fetchProjectsAndChannels();
    }, [channelsOrProjectsUpdateToggle, setProjects, setChannels]);

    if (loadingProjectsAndChannels) {
        return (
            <div className="h-screen w-screen overflow-hidden bg-gray-900 flex items-center justify-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 min-h-screen w-full bg-[var(--dark-bg)]">
            <div className="h-full mx-auto max-w-4xl bg-[var(--dark-bg)]">
                <div className="flex h-full">
                    <ProjectsBar
                        projects={projects}
                        onOpenSettings={() => navigate('/dashboard/settings')}
                        onProjectSelected={() => { /* Navigation handled in ProjectsBar */ }}
                        onOpenOverview={() => navigate('/dashboard')}
                        isOverviewActive={location.pathname === '/dashboard'}
                    />
                    
                    {/* Nested routes render here */}
                    <Outlet />
                </div>
            </div>
        </div>
    );
};
