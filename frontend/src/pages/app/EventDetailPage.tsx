import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventDetails } from '../../components/app/EventDetails';
import { useDashboard } from '../../context/DashboardContext';
import { useNotification } from '../../context/NotificationContext';

export const EventDetailPage: React.FC = () => {
    const { eventId, projectId, channelId } = useParams<{ eventId: string; projectId: string; channelId: string }>();
    const { events, setSelectedEvent, selectedEvent } = useDashboard();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    // Sync event from URL to context
    useEffect(() => {
        if (!eventId) return;

        const event = events.find(e => e.id === eventId);
        
        if (event) {
            setSelectedEvent(event);
        } else if (events.length > 0) {
            console.warn(`Event ${eventId} not found`);
            showNotification('Event not found', 'error', 'Navigation Error');
            navigate(`/dashboard/projects/${projectId}/channels/${channelId}`, { replace: true });
        }
    }, [eventId, events, setSelectedEvent, navigate, showNotification, projectId, channelId]);

    // Show loading state while event is being loaded
    if (!selectedEvent || selectedEvent.id !== eventId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[var(--dark-bg)]">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            </div>
        );
    }

    return <EventDetails />;
};
