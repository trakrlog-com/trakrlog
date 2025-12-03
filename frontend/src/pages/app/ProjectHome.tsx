import React, { useEffect, useState } from "react";
import { ChannelEventsList } from "../../components/app/ChannelEventsList";
import { useDashboard } from "../../context/DashboardContext";
import EmptyState from "../../components/app/EmptyState";

export const ProjectHome: React.FC = () => {
  const { selectedProject, setEvents, events, setSelectedChannel } = useDashboard();
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [, setError] = useState<string | null>(null);

  // Set channel to "all channels" view
  useEffect(() => {
    if (selectedProject) {
      setSelectedChannel({ id: "", name: "all-channels", projectId: selectedProject.id } as any);
    }
  }, [selectedProject, setSelectedChannel]);

  // Fetch all events for the project
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!selectedProject) {
          setEvents([]);
          setLoadingEvents(false);
          return;
        }

        const url = `${import.meta.env.VITE_BACKEND_URL}/api/projects/${selectedProject.id}/events`;
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
  }, [selectedProject, setEvents]);

  if (loadingEvents) {
    return (
      <div className="flex-1 flex items-center justify-center bg-(--dark-bg)">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <EmptyState
        cta=""
        message="No project selected"
        subMessage="Select a project to view events."
      />
    );
  }

  return <ChannelEventsList events={events} />;
};
