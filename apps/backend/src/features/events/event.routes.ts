import { Router } from 'express';
import * as eventController from './event.controller';
import * as auth from "../auth/auth.passport"

const router = Router();

// Create new event via api call
router.post('/', auth.isApiKeyAuthenticated, eventController.createEvent);

// Get events by channel
router.get('/channel/:channelId', auth.isAuthenticated, eventController.getEventsByChannel);

// Get events by project
router.get('/project/:projectId', auth.isAuthenticated, eventController.getEventsByProject);

// Get events by project and channel (with optional search)
router.get('/project/:projectId/channel/:channelId', auth.isAuthenticated, eventController.getEventsByProjectAndChannel);

// Get single event
router.get('/:id', auth.isAuthenticated, eventController.getEvent);

// Delete event
router.delete('/:id', auth.isAuthenticated, eventController.deleteEvent);

export default router;