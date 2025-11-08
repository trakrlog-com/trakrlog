import { useAppContext } from "../../context/AuthContext";
import React from "react";

export const AuthenticatedUser: React.FC = () => {
  const { authContext } = useAppContext();
  const { userData, logoutClick } = authContext;

  if (!userData?.authenticated || !userData.userData) {
    return null; // or render a fallback
  }

  return (
    <>
      <img className="rounded-full hover:cursor-pointer" src={userData.userData.imageUrl} />
    </>
  );
};
