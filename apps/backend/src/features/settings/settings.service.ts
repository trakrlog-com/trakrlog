import { Settings, SettingsModel } from './settings.model';

export const getSettingsByUser = async (userId: string): Promise<SettingsModel | null> => {
    return await Settings.findOne({ userId }).lean<SettingsModel>().exec();
};

export const getSettingsByApiKey = async (apiKey: string): Promise<SettingsModel | null> => {
    return await Settings.findOne({ apiKey }).lean<SettingsModel>().exec();
};

export const updateSettingsForUser = async (userId: string, updates: Partial<SettingsModel>): Promise<SettingsModel> => {
    const { _id, userId: _, ...safeUpdates } = updates;

    const settings = await Settings.findOneAndUpdate(
        { userId },
        { $set: safeUpdates, $setOnInsert: { userId } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean<SettingsModel>().exec();

    if (!settings) {
        throw new Error('Failed to persist settings');
    }

    return settings;
};
