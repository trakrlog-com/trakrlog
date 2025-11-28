export const Divider: React.FC = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-black"></div>
      </div>
    </div>
  );
};
