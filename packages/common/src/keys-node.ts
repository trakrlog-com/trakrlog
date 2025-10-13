import dotenv from "dotenv";

dotenv.config();

export const CLIENT_HOME_PAGE_URL = "http://localhost:3000";

export const AUTH_PROVIDER = process.env.VITE_AUTHPROVIDER as string;
export const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLECLIENTID as string;
export const GOOGLE_CLIENT_SECRET = process.env.VITE_GOOGLECLIENTSECRET as string;

export const SESSION_SECRET = process.env.SESSIONSECRET as string;

export const WAITLIST_ENABLED = process.env.VITE_WAITLISTENABLED === 'true' || false;

export const MONGODB_URI = process.env.DBURI as string;

