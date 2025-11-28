import { NextFunction, Request, Response } from "express";
import * as channelService from "./channel.service";
import { ApiResponseCodes, setErrorResponse, setSuccessResponse } from "@trakrlog/common/httpResponse";
import { UserModel } from "../auth/auth.model";
import { Schema } from "mongoose";

export const getAllChannels = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any).user as UserModel)._id;
        if (!userId) {
            return setErrorResponse(res, ApiResponseCodes.UserAuthFailed);
        }

        const channels = await channelService.getChannelsByUser(userId);
        setSuccessResponse(res, ApiResponseCodes.Success, { channels }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const getChannelsByProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any).user as UserModel)._id;
        const { projectId } = req.params;

        if (!userId || !projectId) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const channels = await channelService.getChannelsByProject(userId, new Schema.Types.ObjectId(projectId));
        setSuccessResponse(res, ApiResponseCodes.Success, { channels }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const createChannel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any).user as UserModel)._id;
        console.log(req.body);
        const { projectId, name, description, icon, type } = req.body;

        if (!userId || !projectId || !name) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const channel = await channelService.createChannel(userId, projectId, name, description, icon, type);
        setSuccessResponse(res, ApiResponseCodes.Success, { channel }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const updateChannel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any).user as UserModel)._id;
        const { channelId } = req.params;
        const updates = req.body;

        if (!userId || !channelId) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const channel = await channelService.updateChannel(userId, new Schema.Types.ObjectId(channelId), updates);
        if (!channel) {
            return setErrorResponse(res, ApiResponseCodes.FlagNotFound);
        }

        setSuccessResponse(res, ApiResponseCodes.Success, { channel }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const deleteChannel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any).user as UserModel)._id;
        const { channelId } = req.params;

        if (!userId || !channelId) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const channel = await channelService.deleteChannel(userId, new Schema.Types.ObjectId(channelId));
        if (!channel) {
            return setErrorResponse(res, ApiResponseCodes.FlagNotFound);
        }

        setSuccessResponse(res, ApiResponseCodes.Success, { channel }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const toggleChannel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any).user as UserModel)._id;
        const { channelId } = req.params;
        const { enabled } = req.body;

        if (!userId || !channelId || enabled === undefined) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const channel = await channelService.toggleChannel(userId, new Schema.Types.ObjectId(channelId), enabled);
        if (!channel) {
            return setErrorResponse(res, ApiResponseCodes.FlagNotFound);
        }

        setSuccessResponse(res, ApiResponseCodes.Success, { channel }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};