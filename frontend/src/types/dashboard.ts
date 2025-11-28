// Shared type definitions for Dashboard features

export type Project = {
    _id: string;
    name: string;
    logoBase64?: string;
}

export type Channel = {
    _id: string;
    name: string;
    projectId: string;
}

export type Event = {
    _id: string;
    channelId: string;
    projectId: string;
    createdAt: string;
    title: string;
    description: string;
    tags: { [key: string]: string };
    icon: string;
}
