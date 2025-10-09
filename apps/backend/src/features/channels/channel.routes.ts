import { Router } from "express";
import * as auth from "../auth/auth.passport";
import * as channelController from './channel.controller';

export const channelRoutes = Router();

// Get all channels for the authenticated user
channelRoutes.get("/", auth.isAuthenticated, channelController.getAllChannels);

// Get all channels for a specific project
channelRoutes.get("/project/:projectId", auth.isAuthenticated, channelController.getChannelsByProject);

// Create a new channel
channelRoutes.post("/", auth.isAuthenticated, channelController.createChannel);

// Update a channel
channelRoutes.put("/:channelId", auth.isAuthenticated, channelController.updateChannel);

// Delete a channel
channelRoutes.delete("/:channelId", auth.isAuthenticated, channelController.deleteChannel);

// Toggle a channel's enabled status
channelRoutes.patch("/:channelId/toggle", auth.isAuthenticated, channelController.toggleChannel);