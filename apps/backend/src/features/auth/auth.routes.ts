import { Router } from "express";
import passport from "passport";
import * as authController from './auth.controller';


export const authRoutes = Router();

/**
 * OAuth authentication routes. (Sign in)
 */
authRoutes.get("/google", passport.authenticate("google"));

authRoutes.get("/google/callback", passport.authenticate("google",  {
    successRedirect: "/dashboard",
    failureRedirect: "/auth/login/failed",
}));

// when login is successful, retrieve user info
authRoutes.get("/is-auth", authController.isLoginAuthenticated);

// when login failed, send failed msg
authRoutes.get("/login/failed", authController.loginFailed);

// When logout, redirect to client
authRoutes.get("/logout", authController.logout);

// set apikey for sdk usage
authRoutes.post("/set-apikey", authController.setApiKey);

