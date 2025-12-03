import React from "react";

const HttpExample: React.FC = () => {
  return (
    <div className="bg-[#1a1919] py-8 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col  items-center justify-between gap-8 lg:gap-12">
          <div className="w-full lg:w-4/5 text-center">
            <p
              className="sm:text-5xl lg:text-6xl font-semibold tracking-tight
                                    text-balance text-white"
            >
              An HTTP request is all you need
            </p>
           
          </div>
          <div className="w-full lg:w-3/5">
            <pre className="rounded-lg bg-black/30 p-4 sm:p-6 shadow-lg overflow-x-auto text-sm sm:text-base">
              <code>
                <div className="flex items-center gap-x-3 flex-wrap">
                  <span className="text-base sm:text-lg font-semibold text-white">POST</span>
                  <span className="text-base sm:text-lg text-white break-all">
                    https://api.trakrlog.com/track
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
    "project_id": "ab565wg",
    "channel_id": "dheud787d"
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
