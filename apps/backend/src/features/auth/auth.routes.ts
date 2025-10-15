import { Router } from "express";
import passport from "passport";
import * as authController from './auth.controller';


export const authRoutes = Router();

/**
 * OAuth authentication routes. (Sign in)
 */
authRoutes.get("/google", passport.authenticate("google"));

authRoutes.get("/google/callback", (req, res, next) => {
    console.log("=== Google OAuth Callback Debug ===");
    console.log("Query params:", req.query);
    console.log("Session ID:", req.sessionID);
    console.log("Session data:", req.session);
    console.log("Headers:", {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-forwarded-proto': req.headers['x-forwarded-proto']
    });
    
    passport.authenticate("google", (err: any, user: any, info: any) => {
        console.log("=== Passport Authenticate Result ===");
        console.log("Error:", err);
        console.log("User:", user);
        console.log("Info:", info);
        
        if (err) {
            console.error("Authentication error:", err);
            return res.redirect("/auth/login/failed?error=auth_error");
        }
        
        if (!user) {
            console.log("No user returned from authentication");
            return res.redirect("/auth/login/failed?error=no_user");
        }
        
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error("Login error:", loginErr);
                return res.redirect("/auth/login/failed?error=login_error");
            }
            
            console.log("Login successful, redirecting to dashboard");
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

// Debug route to check authentication status
authRoutes.get("/debug", (req, res) => {
    res.json({
        sessionID: req.sessionID,
        session: req.session,
        user: req.user,
        isAuthenticated: req.isAuthenticated(),
        cookies: req.cookies,
        signedCookies: req.signedCookies,
        headers: {
            'user-agent': req.headers['user-agent'],
            'x-forwarded-for': req.headers['x-forwarded-for'],
            'x-forwarded-proto': req.headers['x-forwarded-proto'],
            'host': req.headers.host,
            'referer': req.headers.referer
        }
    });
});

