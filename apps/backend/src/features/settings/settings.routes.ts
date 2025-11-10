import { Router } from "express";
import * as auth from "../auth/auth.passport";
import * as settingsController from "./settings.controller";

export const settingsRoutes = Router();

// Fetch the authenticated user's settings
settingsRoutes.get("/", auth.isAuthenticated, settingsController.getUserSettings);

// Update the authenticated user's settings
settingsRoutes.put("/", auth.isAuthenticated, settingsController.updateUserSettings);

// Update the authenticated user's API key
settingsRoutes.put("/apikey", auth.isAuthenticated, settingsController.updateUserApiKey);
