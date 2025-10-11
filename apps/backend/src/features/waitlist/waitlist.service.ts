import { Waitlist, WaitlistModel } from './waitlist.model';

export const addEmailToWaitlist = async (email: string): Promise<WaitlistModel> => {
    // Check if email already exists
    const existingEntry = await Waitlist.findOne({ email: email.toLowerCase().trim() });
    
    if (existingEntry) {
        // Return existing entry instead of throwing error
        return existingEntry;
    }

    const waitlistEntry = new Waitlist({
        email: email.toLowerCase().trim()
    });
    
    return await waitlistEntry.save();
};

export const getAllWaitlistEntries = async (): Promise<WaitlistModel[]> => {
    return await Waitlist.find({}).sort({ createdAt: -1 });
};

export const getWaitlistCount = async (): Promise<number> => {
    return await Waitlist.countDocuments();
};

export const removeEmailFromWaitlist = async (email: string): Promise<WaitlistModel | null> => {
    return await Waitlist.findOneAndDelete({ email: email.toLowerCase().trim() });
};

export const checkEmailExists = async (email: string): Promise<boolean> => {
    const entry = await Waitlist.findOne({ email: email.toLowerCase().trim() });
    return entry !== null;
};