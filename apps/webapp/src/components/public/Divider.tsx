interface DividerProps {
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({ label }) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-gray-800"></div>
      </div>
      {label && (
        <div className="relative flex justify-center">
          <span className="bg-gray-900 px-3 text-base text-gray-500">
            {label}
          </span>
        </div>
      )}
    </div>
  );
};