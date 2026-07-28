import { model, Schema } from "mongoose";
import type { FileSchema } from "./file.types.js";

const fileSchema = new Schema<FileSchema>({
    name: {
        type: String,
        minLength: [1, "File Name should be atleast 1 character long"],
        required: true
    },
    extension : {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        default: "file"
    },
    parentDirectoryId: {
        type: Schema.Types.ObjectId,
        ref: "Directory",
        index: true,
        required: true
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
})

const File = model("File", fileSchema);

export default File;