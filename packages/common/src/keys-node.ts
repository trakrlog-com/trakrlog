import dotenv from "dotenv";

dotenv.config();

export const BACKEND_URL = process.env.BACKEND_URL as string;

export const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLECLIENTID as string;
export const GOOGLE_CLIENT_SECRET = process.env.VITE_GOOGLECLIENTSECRET as string;

export const SESSION_SECRET = process.env.SESSIONSECRET as string;

export const WAITLIST_ENABLED = process.env.VITE_WAITLISTENABLED === 'true' || false;

export const MONGODB_URI = process.env.DBURI as string;

