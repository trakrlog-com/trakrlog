import { type FC, type ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";

interface NotFoundBoundaryProps {
  children: ReactNode;
  validate: (params: Record<string, string | undefined>) => boolean;
}

export const NotFoundBoundary: FC<NotFoundBoundaryProps> = ({ children, validate }) => {
  const params = useParams();

  if (!validate(params)) {
    return <Navigate to="/not-found" replace />;
  }

  return <>{children}</>;
};
