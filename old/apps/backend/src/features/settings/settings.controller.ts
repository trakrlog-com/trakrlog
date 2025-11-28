import { NextFunction, Request, Response } from "express";
import { ApiResponseCodes, setErrorResponse, setSuccessResponse } from "@trakrlog/common/httpResponse";
import * as settingsService from "./settings.service";
import { UserModel } from "../auth/auth.model";
import { randomUUID } from "crypto";
import * as dateUtils from '@trakrlog/common/dateUtils';

export const getUserSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any)?.user as UserModel)?._id?.toString();

        if (!userId) {
            return setErrorResponse(res, ApiResponseCodes.UserAuthFailed);
        }

        let settings = await settingsService.getSettingsByUser(userId);

        if (!settings) {
            settings = await settingsService.updateSettingsForUser(userId, {});
        }

        setSuccessResponse(res, ApiResponseCodes.Success, { settings }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const updateUserSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any)?.user as UserModel)?._id?.toString();

        if (!userId) {
            return setErrorResponse(res, ApiResponseCodes.UserAuthFailed);
        }

        const updates = req.body ?? {};
        const settings = await settingsService.updateSettingsForUser(userId, updates);

        setSuccessResponse(res, ApiResponseCodes.Success, { settings }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const updateUserApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = ((req.user as any)?.user as UserModel)?._id?.toString();
         if (!userId) {
            return setErrorResponse(res, ApiResponseCodes.UserAuthFailed);
        }
        
        // just generate a new API key and update it
        const newApiKey = "pk-" + randomUUID();
        const apiKeyExpiresOn = dateUtils.utcNow().plus({ days: 30 }).toJSDate();
        const updates = {
            apiKey: newApiKey,
            apiKeyExpiresOn: apiKeyExpiresOn,
        };
        
        const settings = await settingsService.updateSettingsForUser(userId, updates);

        setSuccessResponse(res, ApiResponseCodes.Success, { settings }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};
