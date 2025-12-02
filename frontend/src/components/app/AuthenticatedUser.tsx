import { useAppContext } from "../../context/AuthContext";
import React from "react";

export const AuthenticatedUser: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { authContext } = useAppContext();
  const { userData } = authContext;

  if (!userData?.authenticated || !userData.userData) {
    return null; // or render a fallback
  }

  return (
    <div
      className="sidebar-icon rounded-full 
            focus:outline-none ring-2 ring-[var(--dark-bg)] hover:ring-gray-700"
    >
      <img
        alt=""
        onClick={onOpenSettings}
        src={userData.userData.imageUrl}
        className=" rounded-full"
      />
    </div>
  );
};
