import { Schema } from 'mongoose';
import { Event, EventModel } from './event.model';

export const createEvent = async (
    userId: Schema.Types.ObjectId,
    projectId: Schema.Types.ObjectId,
    channelId: Schema.Types.ObjectId,
    title: string,
    description?: string,
    icon?: string,
    tags?: Record<string, string>
) => {
    const event = new Event({
        userId,
        projectId,
        channelId,
        title,
        description,
        icon,
        tags
    });
    return await event.save();
};

export const getEventById = async (eventId: string) => {
    return await Event.findById(eventId);
};

export const getEventsByChannel = async (channelId: string) => {
    return await Event.find({ channelId }).sort({ createdAt: -1 });
};

export const getEventsByProject = async (projectId: string) => {
    return await Event.find({ projectId }).sort({ createdAt: -1 });
};

export const getEventsByProjectAndChannel = async (
    projectId: string,
    channelId: string,
    searchTerm?: string
) => {
    const query: any = { projectId, channelId };
    
    if (searchTerm) {
        query.title = { $regex: searchTerm, $options: 'i' }; // case-insensitive search
    }

    return await Event.find(query).sort({ createdAt: -1 }); // -1 for descending order (newest first)
};


export const deleteEvent = async (eventId: string) => {
    return await Event.findByIdAndDelete(eventId);
};