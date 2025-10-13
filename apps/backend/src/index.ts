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
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "https: data:"]
    }
  })
);

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
    credentials: true, // allow session cookie from browser to pass through
  }),
);


app.use(express.static(path.resolve(__dirname, "../../webapp/dist")));
 

// API Routes - these need to be before the catch-all route
app.use('/auth', authRoutes);
app.use('/projects', projectsRoutes);
app.use('/channels', channelRoutes);
app.use('/events', eventRoutes);
app.use('/waitlist', waitlistRoutes);

// Catch-all route to serve the frontend application for any route
app.use((req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, "../../webapp/dist/", "index.html"));
});


app.listen(port, () => {
  console.log(
    `⚡️[server]: Server is running at http://localhost:${port} , env: ${env}`,
  );
}).on('error', (err) => {
  console.error('⚡️[server]: Failed to start server:', err);
  process.exit(1);
});