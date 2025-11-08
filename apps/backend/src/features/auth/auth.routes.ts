import { Router } from "express";
import passport from "passport";
import * as authController from './auth.controller';


export const authRoutes = Router();

/**
 * OAuth authentication routes. (Sign in)
 */
authRoutes.get("/google", passport.authenticate("google"));

authRoutes.get("/google/callback", (req, res, next) => {
    passport.authenticate("google", (err: any, user: any, info: any) => {
        if (err) {
            return res.redirect("/auth/login/failed?error=auth_error");
        }
        if (!user) {
            return res.redirect("/auth/login/failed?error=no_user");
        }
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                return res.redirect("/auth/login/failed?error=login_error");
            }
            return res.redirect("/dashboard");
        });
    })(req, res, next);
});

authRoutes.get("/github", passport.authenticate("github"));

authRoutes.get("/github/callback", (req, res, next) => {
    passport.authenticate("github", (err: any, user: any, info: any) => {
        if (err) {
            return res.redirect("/auth/login/failed?error=auth_error");
        }
        if (!user) {
            return res.redirect("/auth/login/failed?error=no_user");
        }
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                return res.redirect("/auth/login/failed?error=login_error");
            }
            return res.redirect("/dashboard");
        });
    })(req, res, next);
});


// when login is successful, retrieve user info
authRoutes.get("/is-auth", authController.isLoginAuthenticated);

// when login failed, send failed msg
authRoutes.get("/login/failed", authController.loginFailed);

// When logout, redirect to client
authRoutes.get("/logout", authController.logout);

// set apikey for sdk usage
authRoutes.post("/set-apikey", authController.setApiKey);

