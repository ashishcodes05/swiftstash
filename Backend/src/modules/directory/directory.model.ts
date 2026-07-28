import { model, Schema } from "mongoose";
import type { DirectorySchema } from "./directory.types.js";

const directorySchema = new Schema<DirectorySchema>({
    name: {
        type: String,
        minLength: [1, "Directory Name should be atleast 1 character long"],
        required: true
    },
    type: {
        type: String,
        default: "directory"
    },
    parentDirectoryId: {
        type: Schema.Types.ObjectId,
        default: null,
        ref: "Directory",
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    isShared: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Directory = model("Directory", directorySchema);

export default Directory;