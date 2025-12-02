import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EventItem } from "./EventItemRolling";
import type { Event } from "../../types/dashboard";

export const EventsRoller: React.FC = () => {
  // Sample events data
  const sampleEvents: Event[] = [
    {
      id: "1",
      channelId: "ch1",
      projectId: "proj1",
      createdAt: "2025-11-15T10:30:00Z",
      title: "Player achieved 2000 gold",
      description: "SkyWarrior collected 2000 gold from completing dungeon quests",
      tags: { player: "SkyWarrior", amount: "2000", source: "quests" },
      icon: "💰",
    },
    {
      id: "2",
      channelId: "ch2",
      projectId: "proj1",
      createdAt: "2025-11-15T09:15:00Z",
      title: "New player joined the server",
      description: "ThunderBolt has joined the Emerald Realm server",
      tags: { player: "ThunderBolt", server: "emerald_realm", level: "1" },
      icon: "🎮",
    },
    {
      id: "3",
      channelId: "ch1",
      projectId: "proj2",
      createdAt: "2025-11-15T08:45:00Z",
      title: "Player reached level 50",
      description: "FireMage leveled up to 50 and unlocked elite tier",
      tags: { player: "FireMage", level: "50", tier: "elite" },
      icon: "🌟",
    },
    {
      id: "4",
      channelId: "ch3",
      projectId: "proj1",
      createdAt: "2025-11-14T16:20:00Z",
      title: "Player crafted legendary weapon",
      description: "IronForge crafted the Blade of Eternity",
      tags: { player: "IronForge", item: "blade_of_eternity", rarity: "legendary" },
      icon: "⚒️",
    },
    {
      id: "5",
      channelId: "ch2",
      projectId: "proj2",
      createdAt: "2025-11-14T14:10:00Z",
      title: "Player won 10 matches in a row",
      description: "ShadowNinja achieved a 10-game win streak in ranked mode",
      tags: { player: "ShadowNinja", streak: "10", mode: "ranked" },
      icon: "🔥",
    },
    {
      id: "6",
      channelId: "ch4",
      projectId: "proj3",
      createdAt: "2025-11-14T12:30:00Z",
      title: "New user signed up",
      description: "sarah@company.com created an account on the Pro plan",
      tags: { email: "sarah@company.com", plan: "pro", trial: "14_days" },
      icon: "👤",
    },
    {
      id: "7",
      channelId: "ch4",
      projectId: "proj3",
      createdAt: "2025-11-14T11:00:00Z",
      title: "Subscription upgraded",
      description: "User upgraded from Basic to Enterprise plan",
      tags: { user: "john@startup.io", from: "basic", to: "enterprise" },
      icon: "⬆️",
    },
    {
      id: "8",
      channelId: "ch5",
      projectId: "proj3",
      createdAt: "2025-11-14T09:30:00Z",
      title: "API integration completed",
      description: "TechCorp connected Slack integration successfully",
      tags: { company: "TechCorp", integration: "slack", status: "active" },
      icon: "🔌",
    },
    {
      id: "9",
      channelId: "ch4",
      projectId: "proj3",
      createdAt: "2025-11-14T08:20:00Z",
      title: "Team member invited",
      description: "Admin invited 5 new team members to workspace",
      tags: { workspace: "design_team", invites: "5", role: "member" },
      icon: "📧",
    },
    {
      id: "10",
      channelId: "ch5",
      projectId: "proj3",
      createdAt: "2025-11-14T07:10:00Z",
      title: "Monthly report generated",
      description: "System generated analytics report for October 2025",
      tags: { month: "october", users: "1250", growth: "12%" },
      icon: "📊",
    },
  ];

  // Sample channel names mapping
  const channelNames: { [key: string]: string } = {
    ch1: "Game Events",
    ch2: "Player Actions",
    ch3: "Achievements",
    ch4: "User Activity",
    ch5: "Business Metrics",
  };

  // State for rolling animation
  const [visibleEvents, setVisibleEvents] = useState<Event[]>([]);
  const eventsToShow = 4;

  // Initialize visible events
  useEffect(() => {
    setVisibleEvents(sampleEvents.slice(0, eventsToShow));
  }, []);

  // Auto-advance one event at a time every 2 seconds
  useEffect(() => {
    if (visibleEvents.length === 0) return;

    const interval = setInterval(() => {
      setVisibleEvents((prevEvents) => {
        // Remove the first event and add the next one from the cycle
        const currentFirstEventIndex = sampleEvents.findIndex(
          (event) => event.id === prevEvents[0].id
        );
        const nextEventIndex = (currentFirstEventIndex + eventsToShow) % sampleEvents.length;
        const nextEvent = sampleEvents[nextEventIndex];

        // Create new array with the first event removed and new event added at the end
        return [...prevEvents.slice(1), nextEvent];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [visibleEvents.length]);

  return (
    <div className="bg-(--dark-bg) ">
      <div className="px-6 py-10 sm:py-5 lg:px-8">
        <div className="mx-auto max-w-md">
          <div className="space-y-4 h-[420px] min-h-[420px]">
            <AnimatePresence>
              {visibleEvents.map((event) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{
                    opacity: 0,
                    y: 100,
                    height: 0,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    height: "auto",
                  }}
                  exit={{
                    opacity: 0,
                    y: -100,
                    height: 0,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                    layout: { duration: 0.3 },
                  }}
                  className="overflow-hidden"
                >
                  <EventItem
                    eventData={event}
                    channelName={channelNames[event.channelId] || "Unknown Channel"}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
