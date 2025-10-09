import { Router } from "express";
import * as auth from "../auth/auth.passport"
import * as projectsController from './projects.controller';

export const projectsRoutes = Router();

// Get all projects for the authenticated user
projectsRoutes.get("/", auth.isAuthenticated, projectsController.getAllProjects);

// Get a specific project by ID
projectsRoutes.get("/:projectId", auth.isAuthenticated, projectsController.getProjectById);

// Create a new project
projectsRoutes.post("/", auth.isAuthenticated, projectsController.createProject);

// Update a project
projectsRoutes.put("/:projectId", auth.isAuthenticated, projectsController.updateProject);

// Delete a project
projectsRoutes.delete("/:projectId", auth.isAuthenticated, projectsController.deleteProject);