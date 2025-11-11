import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import "./App.css";
import { DashboardLayout } from "./pages/app/DashboardLayout.tsx";
import { OverviewPage } from "./pages/app/OverviewPage.tsx";
import { SettingsPage } from "./pages/app/SettingsPage.tsx";
import { ProjectLayout } from "./pages/app/ProjectLayout.tsx";
import { ProjectHome } from "./pages/app/ProjectHome.tsx";
import { ChannelPage } from "./pages/app/ChannelPage.tsx";
import { EventDetailPage } from "./pages/app/EventDetailPage.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";
import { MainPage } from "./pages/public/MainPage.tsx";
import PrivateRoute from "./components/app/auth/PrivateRoute.tsx";
import { AuthContextProvider } from "./context/AuthContext.tsx";
import Unauthorized from "./pages/public/Unauthorized.tsx";
import NotFound from "./pages/public/NotFound.tsx";
import Login from "./pages/public/Login.tsx";
import "@fontsource/plus-jakarta-sans/400.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthContextProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/not-found" element={<NotFound />} />
            <Route path="/login" element={<Login />} />

            {/* Dashboard routes - nested structure */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="projects/:projectId" element={<ProjectLayout />}>
                <Route index element={<ProjectHome />} />
                <Route path="channels/:channelId" element={<ChannelPage />} />
                <Route
                  path="channels/:channelId/events/:eventId"
                  element={<EventDetailPage />}
                />
              </Route>
            </Route>

            {/* Redirect all unmatched routes to /not-found */}
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthContextProvider>
  </StrictMode>
);
