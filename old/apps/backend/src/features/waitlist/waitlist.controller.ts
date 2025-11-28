import { NextFunction, Request, Response } from "express";
import * as waitlistService from "./waitlist.service";
import {ApiResponseCodes, setErrorResponse, setSuccessResponse} from "@trakrlog/common/httpResponse";

export const addToWaitlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        // Basic email validation
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const waitlistEntry = await waitlistService.addEmailToWaitlist(email);
        setSuccessResponse(res, ApiResponseCodes.Success, { 
            message: 'Successfully added to waitlist',
            email: waitlistEntry.email,
            id: waitlistEntry._id
        }, req);
    } catch (error) {
        console.error('Error adding to waitlist:', error);
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const getWaitlistStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await waitlistService.getWaitlistCount();
        setSuccessResponse(res, ApiResponseCodes.Success, { 
            count,
            message: `${count} people on the waitlist`
        }, req);
    } catch (error) {
        console.error('Error getting waitlist stats:', error);
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const getAllWaitlistEntries = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const entries = await waitlistService.getAllWaitlistEntries();
        setSuccessResponse(res, ApiResponseCodes.Success, { 
            entries,
            count: entries.length
        }, req);
    } catch (error) {
        console.error('Error getting waitlist entries:', error);
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const removeFromWaitlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.params;

        if (!email) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const removedEntry = await waitlistService.removeEmailFromWaitlist(email);
        
        if (!removedEntry) {
            return setErrorResponse(res, ApiResponseCodes.FlagNotFound);
        }

        setSuccessResponse(res, ApiResponseCodes.Success, { 
            message: 'Email removed from waitlist',
            email: removedEntry.email
        }, req);
    } catch (error) {
        console.error('Error removing from waitlist:', error);
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};