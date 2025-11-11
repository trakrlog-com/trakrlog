import { UserModel } from "./auth.model";
import * as userService from "./auth.service";
import * as dateUtils from '@trakrlog/common/dateUtils';
import { ApiResponseCodes, setErrorResponse,  setSuccessResponse} from "@trakrlog/common/httpResponse";
import { NextFunction, Request, Response } from "express";
import * as keys from '@trakrlog/common/keys-node';
import { randomUUID } from "crypto";
import { settingsService } from "../settings";

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

            const userData = await userService.getUser({ email: email });
            if (!userData) {
                return null;
            }

            // create settings for the new user
            await settingsService.updateSettingsForUser(userData._id!.toString(), {
                apiKey: "pk-" + randomUUID(),
                apiKeyExpiresOn: dateUtils.utcNow().plus({ days: 30 }).toJSDate(),
            });

            console.log(`new user ${newUser.name} created.`);

            // send email to me and the user
            // await emailHelper.sendEmailInternalForNewUser(newUser);
            // await emailHelper.sendWelcomeEmail(newUser.email, newUser.name);

            return newUser;
        }

    } else {
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
        res.redirect(keys.BACKEND_URL + (process.env.NODE_ENV === 'development' ? ':' + process.env.PORT : ''));
    });
}

export const loginFailed = (req: Request, res: Response) => {
    res.redirect(keys.BACKEND_URL  + (process.env.NODE_ENV === 'development' ? ':' + process.env.PORT : '') + "/unauthorized");
}
