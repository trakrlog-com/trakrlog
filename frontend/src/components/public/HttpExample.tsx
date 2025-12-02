import React from "react";

const Underline = () => (
  <svg width="380" height="40" viewBox="0 0 380 40" className="text-gray-400 max-w-full">
    <path
      d="M20 20 C80 28, 140 12, 200 20 C260 28, 320 12, 360 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-draw"
      style={{
        strokeDasharray: 1000,
        strokeDashoffset: 0,
        animation: "draw 2s ease-in-out forwards",
      }}
    />
  </svg>
);

const HttpExample: React.FC = () => {
  return (
    <div className="bg-[#1a1919] py-8 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          <div className="w-full lg:w-2/5 text-center">
            <p
              className="text-3xl sm:text-4xl font-semibold tracking-tight
                                    text-balance text-white"
            >
              An HTTP request is <br className="hidden sm:inline" /> all you need
            </p>
            <div className="flex justify-center mt-4 sm:mt-6">
              <Underline />
            </div>
          </div>
          <div className="w-full lg:w-3/5">
            <pre className="rounded-lg bg-black/30 p-4 sm:p-6 shadow-lg overflow-x-auto text-sm sm:text-base">
              <code>
                <div className="flex items-center gap-x-3 flex-wrap">
                  <span className="text-base sm:text-lg font-semibold text-white">POST</span>
                  <span className="text-base sm:text-lg text-white break-all">
                    https://api.trakrlog.com/v1/events
                  </span>
                </div>
                <span className="block text-gray-200 mt-3">{`{
    "title": "Megafactory Unlocked", 
    "description": "Reached 1000 circuits per minute", 
    "icon": "🎃",
    "tags": {
        "fps": "20",
        "achievement_id": "f5d386476"
    },
    "project_id": "Left Stranded",
    "channel_id": "alerts"
}`}</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HttpExample;
