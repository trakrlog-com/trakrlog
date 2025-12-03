import React from "react";

type StatItemProps = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
};

export const AtGlance: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">At a Glance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatItem label="Total Entries" value={128} />
        <StatItem label="This Week" value={42} />
        <StatItem label="Average Time" value="2.5h" />
        <StatItem label="Active Projects" value={5} />
      </div>
    </div>
  );
};

const StatItem: React.FC<StatItemProps> = ({ label, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center justify-between">
      {icon && <span className="text-gray-500">{icon}</span>}
      <div className="text-right">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  </div>
);
