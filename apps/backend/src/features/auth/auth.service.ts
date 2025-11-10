import { User, UserModel} from './auth.model';

export const getUser = async (search: {
    userId?: string;
    email?: string;
}): Promise<UserModel | null> => {
    try {
        if (search.userId) {
            const user = await User.findById(search.userId).lean();
            return user as UserModel | null;
        }

        if (search.email) {
            const user = await User.findOne({ email: search.email }).lean();
            return user as UserModel | null;
        }

        return null;
    } catch (error) {
        console.error('Error in getUser:', error);
        return null;
    }
};

export const addUser = async (user: UserModel): Promise<boolean> => {
    try {
        const existingUser = await getUser({ email: user.email });
        if (!existingUser) {
            const newUser = new User(user);
            await newUser.save();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error in addUser:', error);
        return false;
    }
};

export const updateUser = async (user: UserModel): Promise<boolean> => {
    try {
        const existingUser = await getUser({ email: user.email });
        if (existingUser) {
            await User.findByIdAndUpdate(existingUser._id, {
                $set: {
                    name: user.name,
                    email: user.email,
                    isBlocked: user.isBlocked,
                    imageUrl: user.imageUrl
                }
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error in updateUser:', error);
        return false;
    }
};

 