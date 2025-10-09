import { Channel, ChannelModel } from './channel.model';
import { ObjectId } from 'mongoose';


export const getChannelsByUser = async (userId: ObjectId): Promise<ChannelModel[]> => {
    return await Channel.find({ userId: userId });
};

export const getChannelsByProject = async (userId: ObjectId, projectId: ObjectId): Promise<ChannelModel[]> => {
    return await Channel.find({ userId, projectId });
};

export const getChannelById = async (userId: ObjectId, channelId: ObjectId): Promise<ChannelModel | null> => {
    return await Channel.findOne({ userId, _id: channelId });
};

export const getChannelByName = async (userId: ObjectId, projectId: ObjectId, channelName: string): Promise<ChannelModel | null> => {
    return await Channel.findOne({ userId, projectId, name: channelName });
};

export const createChannel = async (userId: ObjectId, 
        projectId: ObjectId, 
        name: string, 
        description?: string, 
        icon?: string, 
        type?: string) => {
    const channel = new Channel({
        userId,
        projectId,
        name,
        description,
        icon,
        type,
        enabled: true
    });
    return await channel.save();
};

export const updateChannel = async (userId: ObjectId, channelId: ObjectId, updates: Record<string, any>): Promise<ChannelModel | null> => {
    return await Channel.findOneAndUpdate(
        { userId: userId, _id: channelId },
        { $set: updates },
        { new: true }
    );
};

export const deleteChannel = async (userId: ObjectId, channelId: ObjectId): Promise<ChannelModel | null> => {
    return await Channel.findOneAndDelete({ userId: userId, _id: channelId });
};

export const toggleChannel = async (userId: ObjectId, channelId: ObjectId, enabled: boolean): Promise<ChannelModel | null> => {
    return await Channel.findOneAndUpdate(
        { userId: userId, _id: channelId },
        { $set: { enabled: enabled } },
        { new: true }
    );
};