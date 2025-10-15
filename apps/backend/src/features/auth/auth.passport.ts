import passport from "passport";
import { Request, Response, NextFunction, Express } from "express";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as keys from "@trakrlog/common/keys-node";
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
  passport.serializeUser(
    (_req: any, user: any, done: (arg0: null, arg1: any) => void) => {
      console.log("=== Serialize User ===");
      console.log("User to serialize:", user ? {
        id: user._id || user.id,
        email: user.email
      } : null);
      done(null, user);
    }
  );

  // deserialize the cookieUserId to user in the database
  passport.deserializeUser(async (id: string, done) => {
    console.log("=== Deserialize User ===");
    console.log("Deserializing user ID:", id);
    
    try {
      const currentUser = await userService.getUser({ userId: id });
      console.log("Found user:", currentUser ? {
        id: currentUser._id,
        email: currentUser.email
      } : null);
      
      done(currentUser === null ? "user not found." : null, {
        user: currentUser,
      });
    } catch (error) {
      console.error("Deserialize error:", error);
      done(error, null);
    }
  });

  console.log(" -> Google auth active");
  
  // Debug OAuth configuration
  const callbackURL = (env !== "development" ? keys.BACKEND_URL : "") + "/auth/google/callback";
  console.log("=== OAuth Configuration Debug ===");
  console.log("Environment:", env);
  console.log("Backend URL:", keys.BACKEND_URL);
  console.log("Callback URL:", callbackURL);
  console.log("Client ID:", keys.GOOGLE_CLIENT_ID ? `${keys.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT SET');
  console.log("Client Secret:", keys.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: keys.GOOGLE_CLIENT_ID,
        clientSecret: keys.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
        scope: ["profile", "email"],
        state: true,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: UserModel) => void
      ) => {
        try {
          console.log("=== Google Strategy Callback ===");
          console.log("Access Token length:", accessToken?.length || 0);
          console.log("Profile ID:", profile.id);
          console.log("Profile JSON:", {
            email: profile._json.email,
            name: profile._json.name,
            email_verified: profile._json.email_verified,
            picture: profile._json.picture
          });
          
          // Use the service layer to handle business logic
          const userData = await authController.createUser(
            profile._json.email,
            profile._json.name,
            profile._json.picture,
            profile._json.email_verified
          );
          
          console.log("User creation result:", userData ? 'Success' : 'Failed');
          console.log("User data:", userData ? {
            id: userData._id,
            email: userData.email,
            name: userData.name
          } : null);
          
          if (!userData) {
            console.error("User creation failed - email not verified or other issue");
            return done(new Error("User creation failed"));
          }
          
          return done(null, userData);
        } catch (error) {
          console.error("Google Strategy error:", error);
          return done(error);
        }
      }
    )
  );
};

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated()) {
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
  next: NextFunction
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

  const isValid =
    apiKeyFound !== null &&
    DateTime.fromJSDate(apiKeyFound.apiKeyExpiresOn!) > DateTime.now();

  if (isValid) {
    return next();
  }

  res.status(401).json({
    error: ApiResponseCodes.ApiKeyNotValid,
  });

  return;
};
