import {
  ClockIcon,
  ChartBarIcon,
  CubeIcon,
  UserGroupIcon,
  BellIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const dynamicWords = ["your game", "your app", "your IoT system", "your deliveries"];

const features = [
  {
    name: "Real-time Event Logging",
    description:
      "Track gameplay events, performance metrics, and system data in real-time. Get instant insights with our lightweight, performance-optimized SDKs for all major game engines.",
    icon: ClockIcon,
  },
  {
    name: "Advanced Analytics",
    description:
      "Powerful dashboards and tools to analyze your game data. Identify trends, debug issues, and make data-driven decisions with detailed insights and visualizations.",
    icon: ChartBarIcon,
  },
  {
    name: "Game Engines SDK",
    description:
      "First-class support for Godot and Unity with native SDKs. Integrate in minutes with drag-and-drop components, automatic context capture, and engine-specific optimizations.",
    icon: CubeIcon,
  },
  {
    name: "Web Frameworks SDK",
    description:
      "Seamless integration with React, Node.js, and other popular web frameworks. Built-in TypeScript support, middleware packages, and hooks for efficient logging and monitoring.",
    icon: CodeBracketIcon,
  },
  {
    name: "Users Insights",
    description:
      "Understand how users experience your game with detailed session recordings, progression analytics, and heat maps. Make data-driven decisions for game balance.",
    icon: UserGroupIcon,
  },
  {
    name: "Smart Notifications",
    description:
      "Stay instantly informed with intelligent push notifications. Get real-time alerts for critical events, performance issues, or player milestones. Never miss important updates about your game or app.",
    icon: BellIcon,
  },
];

export const Features = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % dynamicWords.length);
    }, 3000); // Change text every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[var(--dark-bg)] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-10">
        <div className="mx-auto  max-w-4xl ">
          <span className="text-2xl/7 font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Built for developers, powered by data
          </span>
          <p className="mt-4 text-5xl font-bold tracking-tight text-pretty text-white sm:text-5xl lg:text-6xl lg:text-balance">
            Know everything around
          </p>
          <div className="mt-4 h-24 sm:h-32">
            <div
              className="flex items-baseline   text-5xl font-bold 
                    tracking-tight text-pretty text-white sm:text-5xl lg:text-6xl lg:text-balance"
            >
              <span className="inline-block lg:min-w-[310px] text-left">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={dynamicWords[currentIndex]}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="block"
                  >
                    {dynamicWords[currentIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-20">
                <dt className="text-xl/7 font-bold text-white">
                  <div
                    className="absolute top-0 left-0 flex size-16 items-center justify-center 
                    rounded-lg bg-gradient-to-r from-white to-white/80"
                  >
                    <feature.icon aria-hidden="true" className="size-10 text-black" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-3 text-lg/8 text-gray-400">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};
