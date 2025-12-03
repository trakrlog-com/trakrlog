import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChannelEventsList } from "../../components/app/ChannelEventsList";
import { useDashboard } from "../../context/DashboardContext";
import { useNotification } from "../../context/NotificationContext";

export const ChannelPage: React.FC = () => {
  const { channelId, projectId } = useParams<{
    channelId: string;
    projectId: string;
  }>();
  const { channels, selectedProject, setSelectedChannel, setEvents, events } = useDashboard();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [, setError] = useState<string | null>(null);

  // Sync channel from URL to context
  useEffect(() => {
    if (!projectId) return;

    if (channelId === "") {
      // Special case for "all channels"
      setSelectedChannel({ id: "", name: "all-channels", projectId } as any);
    } else {
      const channel = channels.find((c) => c.id === channelId);

      if (channel) {
        setSelectedChannel(channel);
      } else if (channels.length > 0) {
        console.warn(`Channel ${channelId} not found`);
        showNotification("Channel not found", "error", "Navigation Error");
        navigate(`/dashboard/projects/${projectId}`, { replace: true });
      }
    }
  }, [channelId, projectId, channels, setSelectedChannel, navigate, showNotification]);

  // Fetch events for this channel
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!selectedProject) {
          setEvents([]);
          setLoadingEvents(false);
          return;
        }

        let url = "";
        if (channelId && channelId !== undefined) {
          url = `/api/channels/${channelId}/events`;
        } else {
          url = `/api/projects/${selectedProject.id}/events`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          setLoadingEvents(false);
          throw new Error("Failed to fetch events");
        }

        const { data } = await response.json();
        setEvents(data);
        setLoadingEvents(false);
      } catch (err) {
        setError("Failed to fetch events");
        setLoadingEvents(false);
        console.error("Error fetching events:", err);
      }
    };

    fetchEvents();

    // Poll for new events every 10 seconds
    const interval = setInterval(() => {
      fetchEvents();
    }, 10000);

    return () => clearInterval(interval);
  }, [channelId, selectedProject, setEvents]);

  if (loadingEvents) {
    return (
      <div className="flex-1 flex items-center justify-center bg-(--dark-bg)">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
      </div>
    );
  }

  return <ChannelEventsList events={events} />;
};
