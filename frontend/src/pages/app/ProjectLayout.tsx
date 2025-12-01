import React, { useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { ChannelBar } from '../../components/app/ChannelBar';
import { useDashboard } from '../../context/DashboardContext';
import { useNotification } from '../../context/NotificationContext';

export const ProjectLayout: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { projects, channels, setSelectedProject, selectedProject } = useDashboard();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    // Sync project from URL to context
    useEffect(() => {
        if (!projectId) return;

        console.log('Projects available:', projects);

        const project = projects.find(p => p.id === projectId);
        
        if (project) {
            // Only update if different to avoid unnecessary re-renders
            if (selectedProject?.id !== project.id) {
                setSelectedProject(project);
            }
        } else if (projects.length > 0) {
            // Project not found and we have projects loaded
            console.warn(`Project ${projectId} not found`);
            showNotification('Project not found', 'error', 'Navigation Error');
            navigate('/dashboard', { replace: true });
        }
    }, [projectId, projects, selectedProject, setSelectedProject, navigate, showNotification]);

    // Don't render until we have a valid project
    if (!selectedProject || selectedProject.id !== projectId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[var(--dark-bg)]">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            </div>
        );
    }

    return (
        <>
            <ChannelBar channels={channels} />
            {/* Nested project routes render here */}
            <Outlet />
        </>
    );
};
