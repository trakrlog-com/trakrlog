import { UserModel } from "./auth.model";
import * as userService from "./auth.service";
import * as dateUtils from '@trakrlog/common/dateUtils';
import { ApiResponseCodes, setErrorResponse,  setSuccessResponse} from "@trakrlog/common/httpResponse";
import { NextFunction, Request, Response } from "express";
import * as keys from '@trakrlog/common/keys-node';
import { randomUUID } from "crypto";

export const createUser = async (email?: string, name?: string, picture?: string, is_email_verified?: boolean): Promise<UserModel | null> => {
    // find current user
    const currentUser = await userService.getUser({
        email: email,
    });

    if (!is_email_verified) {
        return null;
    }

    // create new user if the database doesn't have this user
    if (!currentUser) {
        const newUser = {
            name,
            imageUrl: picture,
            createdOn: dateUtils.utcNow().toJSDate(),
            updatedOn: dateUtils.utcNow().toJSDate(),
            email,
            isBlocked: false,
        } as UserModel;

        if (await userService.addUser(newUser)) {
            console.log(`new user ${newUser.name} created.`);

            // send email to me and the user
            // await emailHelper.sendEmailInternalForNewUser(newUser);
            // await emailHelper.sendWelcomeEmail(newUser.email, newUser.name);

            return newUser;
        }

    } else {
        console.log(`user ${currentUser.name} already registered.`);
        currentUser.imageUrl = picture;
        await userService.updateUser(currentUser);
        return currentUser;
    }

    return null;
};


export const isLoginAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        res.json({
            success: true,
            message: "user has successfully authenticated",
            user: req.user,
            cookies: req.cookies,
        });
    } else {
        setErrorResponse(res, ApiResponseCodes.UserAuthFailed);
    }
}

export const logout = (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect(keys.BACKEND_URL);
    });
}

export const loginFailed = (req: Request, res: Response) => {
    console.log("=== Login Failed Debug ===");
    console.log("Query params:", req.query);
    console.log("Session:", req.session);
    console.log("User:", req.user);
    console.log("Is authenticated:", req.isAuthenticated());
    
    const errorType = req.query.error as string || 'unknown';
    console.log("Error type:", errorType);
    
    // In production, you might want to redirect to a proper error page
    // For now, let's show the error information
    res.status(401).json({
        error: 'Authentication failed',
        type: errorType,
        timestamp: new Date().toISOString(),
        sessionId: req.sessionID
    });
}

export const setApiKey = async (req: Request, res: Response) => {
    try {
        const userId = ((req.user as any).user as UserModel)._id;
        if (!userId) {
            return setErrorResponse(res, ApiResponseCodes.UserAuthFailed);
        }

        // generate a new api key and set expiry date (30 days from now)
        const apiKey = randomUUID();
        const apiKeyExpiresOn = dateUtils.utcNow().plus({ days: 30 }).toJSDate();

        const success = await userService.setApiKey(userId.toString(), apiKey, apiKeyExpiresOn);
        if (!success) {
            return setErrorResponse(res, ApiResponseCodes.GenericError);
        }

        setSuccessResponse(res, ApiResponseCodes.Success, { apiKey, apiKeyExpiresOn }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
}
