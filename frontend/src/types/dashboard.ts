// Shared type definitions for Dashboard features

export type Project = {
    id: string;
    name: string;
    logoBase64?: string;
}

export type Channel = {
    id: string;
    name: string;
    projectId: string;
}

export type Event = {
    id: string;
    channelId: string;
    projectId: string;
    createdAt: string;
    title: string;
    description: string;
    tags: { [key: string]: string };
    icon: string;
}
