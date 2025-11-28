import { Router } from "express";
import * as waitlistController from './waitlist.controller';

export const waitlistRoutes = Router();

// Add email to waitlist (public endpoint - no authentication required)
waitlistRoutes.post("/", waitlistController.addToWaitlist);

// Get waitlist statistics (public endpoint)
waitlistRoutes.get("/stats", waitlistController.getWaitlistStats);

// Get all waitlist entries (admin only - would need auth middleware)
// waitlistRoutes.get("/", auth.isAuthenticated, waitlistController.getAllWaitlistEntries);

// Remove email from waitlist (admin only - would need auth middleware)  
// waitlistRoutes.delete("/:email", auth.isAuthenticated, waitlistController.removeFromWaitlist);