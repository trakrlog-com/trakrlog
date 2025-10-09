import { Schema } from "mongoose";

export type BaseModel = {
    _id?: Schema.Types.ObjectId;
    name: string;
    key: string;
    description?: string;
    createdOn: Date;
    updatedOn: Date;
};