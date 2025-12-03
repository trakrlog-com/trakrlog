import React, { type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../../../context/AuthContext";
import { DashboardProvider } from "../../../context/DashboardContext";

const PrivateRoute: React.FC<{ children: ReactElement }> = ({ children }) => {
  const { authContext } = useAppContext();

  return !(authContext.userData?.authenticated as boolean) ? (
    <Navigate replace to={"/unauthorized"} />
  ) : (
    <DashboardProvider>{children}</DashboardProvider>
  );
};

export default PrivateRoute;
