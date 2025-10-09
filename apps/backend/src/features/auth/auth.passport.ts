import passport from "passport";
import { Request, Response, NextFunction, Express } from "express";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as keys from '@trakrlog/common/keys';
import * as userService from "./auth.service";
import * as authController from "./auth.controller";
import { Profile } from "passport-google-oauth20";
import { UserModel } from "./auth.model";
import { ApiResponseCodes } from "@trakrlog/common/httpResponse";
import { DateTime } from "luxon";


export const initialise = (app: Express) => {

    const env = process.env.NODE_ENV;
    app.use(passport.initialize());

    // serialize the user.id to save in the cookie session
    // so the browser will remember the user when login
    passport.serializeUser((_req: any, user: any, done: (arg0: null, arg1: any) => void) => {
        done(null, user);
    });

    // deserialize the cookieUserId to user in the database
    passport.deserializeUser(async (id: string, done) => {
        const currentUser = await userService.getUser({ userId: id });
        done(currentUser === null ? "user not found." : null, {
            user: currentUser,
        });
    });

    if (keys.AUTH_PROVIDER === "google") {
        console.log(" -> Google auth active");
        passport.use(new GoogleStrategy(
            {
                clientID: keys.GOOGLE_CLIENT_ID,
                clientSecret: keys.GOOGLE_CLIENT_SECRET,
                callbackURL:
                    (env !== "dev" ? keys.CLIENT_HOME_PAGE_URL : "") +
                    "/auth/google/callback",
                scope: ["profile", "email"],
                state: true,
            },
            async (accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: UserModel) => void) => {
                try {
                    // Use the service layer to handle business logic
                    const userData = await authController.createUser(
                        profile._json.email,
                        profile._json.name,
                        profile._json.picture,
                        profile._json.email_verified
                    );
                    return done(null, userData!);
                } catch (error) {
                    return done(error);
                }
            }
        ));
    }
};

export const isAuthenticated = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (!keys.AUTH_PROVIDER || req.isAuthenticated()) {
        return next();
    }
    res.redirect("/");
};

/*
 ** - Get the apikey from the sdk request
 ** - Lookup of the key in db
 ** - Ensure it is not expired
 */
export const isApiKeyAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const apiKey = req.headers["tl-api-key"] as string;
    if (!apiKey) {
        res.status(401).json({
            error: ApiResponseCodes.ApiKeyNotFound, 
        });

        return;
    }
    const apiKeyFound = await userService.getApiKey({ apiKey: apiKey });

    if (!apiKeyFound) {
        res.status(401).json({
            error: ApiResponseCodes.ApiKeyNotFound,
        });
        return;
    }

    const isValid = apiKeyFound !== null && DateTime.fromJSDate(apiKeyFound.apiKeyExpiresOn!) > DateTime.now();

    if (!keys.AUTH_PROVIDER || isValid) {
        return next();
    }

    res.status(401).json({
        error: ApiResponseCodes.ApiKeyNotValid,
    });

    return;
};