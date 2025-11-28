import { Project, ProjectModel } from './projects.model';
import { ObjectId } from 'mongoose';

export const getAllProjects = async (userId: string): Promise<ProjectModel[]> => {
    return await Project.find({ userId: userId });
};

export const getProjectById = async (userId: string, projectId: string): Promise<ProjectModel | null> => {
    return await Project.findOne({ userId: userId, _id: projectId });
};

export const getProjectByName = async (userId: ObjectId, projectName: string): Promise<ProjectModel | null> => {
    return await Project.findOne({ userId: userId, name: projectName });
};

export const createProject = async (userId: ObjectId, name: string, description?: string, logoBase64?: string) => {
    const project = new Project({
        userId,
        name,
        description,
        logoBase64
    });
    return await project.save();
};

export const updateProject = async (userId: ObjectId, projectId: ObjectId, updates: Partial<ProjectModel>) : Promise<ProjectModel | null> => {
    // Remove fields that shouldn't be updated
    const { _id, userId: _, ...safeUpdates } = updates;
    
    return await Project.findOneAndUpdate(
        { userId: userId, _id: projectId },
        { $set: safeUpdates },
        { new: true }
    );
};

export const deleteProject = async (userId: string, projectId: string): Promise<ProjectModel | null> => {
    return await Project.findOneAndDelete({ userId: userId, _id: projectId });
};
