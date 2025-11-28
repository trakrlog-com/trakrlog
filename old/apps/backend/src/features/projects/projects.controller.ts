import { NextFunction, Request, Response } from "express";
import * as projectsService from "./projects.service";
import {ApiResponseCodes, setErrorResponse, setSuccessResponse} from "@trakrlog/common/httpResponse";
import { UserModel } from "../auth/auth.model";
import { Schema } from "mongoose";

export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any).user as UserModel)._id;
        if (!userId) {
            return setErrorResponse(res, ApiResponseCodes.UserAuthFailed);
        }

        const projects = await projectsService.getAllProjects(userId.toString());
        setSuccessResponse(res, ApiResponseCodes.Success, { projects }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any).user as UserModel)._id;
        const { projectId } = req.params;

        if (!userId || !projectId) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const project = await projectsService.getProjectById(userId.toString(), projectId);
        if (!project) {
            return setErrorResponse(res, ApiResponseCodes.FlagNotFound);
        }

        setSuccessResponse(res, ApiResponseCodes.Success, { project }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any).user as UserModel)._id;
        const { name, description, logoBase64 } = req.body;

        if (!userId || !name) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const project = await projectsService.createProject(userId, name, description, logoBase64);
        setSuccessResponse(res, ApiResponseCodes.Success, { project }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any).user as UserModel)._id;
        const { projectId } = req.params;
        const updates = req.body;

        if (!userId || !projectId) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const project = await projectsService.updateProject(userId, new Schema.Types.ObjectId(projectId), updates);
        if (!project) {
            return setErrorResponse(res, ApiResponseCodes.FlagNotFound);
        }

        setSuccessResponse(res, ApiResponseCodes.Success, { project }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any).user as UserModel)._id;
        const { projectId } = req.params;

        if (!userId || !projectId) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const project = await projectsService.deleteProject(userId.toString(), projectId);
        if (!project) {
            return setErrorResponse(res, ApiResponseCodes.FlagNotFound);
        }

        setSuccessResponse(res, ApiResponseCodes.Success, { project }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};