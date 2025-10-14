import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Express } from 'express';
import passport from 'passport';
import session from 'express-session';
import * as passportAuth from "./features/auth/auth.passport";
import path from "path";
import cookieParser from "cookie-parser";
import { connectDB } from './config/database';
import * as keys from '@trakrlog/common/keys-node';
import { Request, Response } from "express"; 
import { authRoutes } from './features/auth/auth.routes';
import { projectsRoutes } from './features/projects';
import { channelRoutes } from './features/channels';
import { eventRoutes } from './features/events';
import { waitlistRoutes } from './features/waitlist';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();
const env = process.env.NODE_ENV;

// Create Express application
const app: Express = express();
const port = parseInt(process.env.PORT || '4000', 10);

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers

// Simple helmet configuration with relaxed CSP for React/Vite
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "'unsafe-inline'", "https:"],
      "script-src-elem": ["'self'", "'unsafe-inline'", "https:"],
      "style-src": ["'self'", "'unsafe-inline'", "https:"],
      "img-src": ["'self'", "https:", "data:", "blob:"],
      "font-src": ["'self'", "https:", "data:"],
      "connect-src": ["'self'", "https:", "ws:", "wss:"]
    }
  }
}));

app.use(cookieParser());

// used for post requests
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  session({
    secret: keys.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }),
);

passportAuth.initialise(app);
app.use(passport.session());

app.use(
  cors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  }),
);

// Handle static file serving for both development and compiled environments
const getStaticPath = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production (compiled with Bun), look for static files relative to the executable
    return path.join(process.cwd(), 'frontend/build');
  } else {
    // In development, use the relative path
    return path.join(__dirname, '../../frontend/dist');
  }
};

const staticPath = getStaticPath();
console.log(`Serving static files from: ${staticPath}`);

// Serve static files with relaxed CSP
app.use(express.static(staticPath, {
  setHeaders: (res, path) => {
    // Relax CSP for HTML files
    if (path.endsWith('.html')) {
      res.setHeader('Content-Security-Policy', 
        "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' https: data: blob:; connect-src 'self' https: ws: wss:;"
      );
    }
  }
}));

// API Routes - these need to be before the catch-all route
app.use('/auth', authRoutes);
app.use('/projects', projectsRoutes);
app.use('/channels', channelRoutes);
app.use('/events', eventRoutes);
app.use('/waitlist', waitlistRoutes);

// Catch-all route to serve the frontend application for any route
app.use((req: Request, res: Response) => {
    const indexPath = path.join(staticPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Error loading application');
        }
    });
});


app.listen(port, () => {
  console.log(
    `⚡️[server]: Server is running at ${keys.BACKEND_URL}:${port} , env: ${env}`,
  );
}).on('error', (err) => {
  console.error('⚡️[server]: Failed to start server:', err);
  process.exit(1);
});