import { Request, Response } from 'express';
import * as eventService from './event.service';
import * as authService from '../auth/auth.service';
import * as projectsService from '../projects/projects.service';
import * as channelsService from '../channels/channel.service';
import { ApiResponseCodes, setErrorResponse,  setSuccessResponse} from "@trakrlog/common/httpResponse";


export const createEvent = async (req: Request, res: Response) => {
    try {
        const { project_id, channel_id, title, description, icon, tags } = req.body;
        const apiKey = req.headers["tl-api-key"] as string;
        const user = await authService.getUser({ apiKey });
        const userId = user!._id;


        if (!userId || !title || !project_id || !channel_id) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const project = await projectsService.getProjectByName(userId!, project_id);
        if (!project?._id) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const channel = await channelsService.getChannelByName(userId!, project._id, channel_id);
        if (!channel?._id) {
            return setErrorResponse(res, ApiResponseCodes.InputMissing);
        }

        const event = await eventService.createEvent(
            userId,
            project._id,
            channel._id,
            title,
            description,
            icon,
            tags
        );
        setSuccessResponse(res, ApiResponseCodes.Success, { event }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const getEvent = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        const event = await eventService.getEventById(eventId);
        if (!event) {
            setErrorResponse(res, ApiResponseCodes.GenericError);
        }
        setSuccessResponse(res, ApiResponseCodes.Success, { event }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const getEventsByChannel = async (req: Request, res: Response) => {
    try {
        const { channelId } = req.params;
        const events = await eventService.getEventsByChannel(channelId); 
        setSuccessResponse(res, ApiResponseCodes.Success, { events }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const getEventsByProject = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const events = await eventService.getEventsByProject(
            projectId
        );
        setSuccessResponse(res, ApiResponseCodes.Success, { events }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};

export const getEventsByProjectAndChannel = async (req: Request, res: Response) => {
    try {
        const { projectId, channelId } = req.params;
        const { search } = req.query;

        const events = await eventService.getEventsByProjectAndChannel(
            projectId,
            channelId,
            typeof search === 'string' ? search : undefined
        );
        setSuccessResponse(res, ApiResponseCodes.Success, { events }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};


export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        await eventService.deleteEvent(eventId);
        setSuccessResponse(res, ApiResponseCodes.Success, { message: 'Event deleted successfully' }, req);
    } catch (error) {
        setErrorResponse(res, ApiResponseCodes.GenericError);
    }
};
