import * as mongoose from 'mongoose';
import config from '../../config';
import { errorHandler } from '../../utils/mongoose';
import { IFile, IFolder, IFsObject, IShortcut } from './interface';

const schemaOptions = {
    discriminatorKey: 'type',
    timestamps: true,
};

const FsObjectSchema = new mongoose.Schema<IFsObject & mongoose.Document>(
    {
        name: {
            type: String,
            required: true,
        },
        parent: {
            type: 'ObjectId',
            default: null,
            ref: config.mongo.fsObjectsCollectionName,
        },
    },
    schemaOptions,
);

const FileSchema = new mongoose.Schema<IFile & mongoose.Document>(
    {
        key: {
            type: String,
            required: true,
        },
        bucket: {
            type: String,
            required: true,
        },
        source: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            required: true,
        },
        public: {
            type: Boolean,
            required: true,
        },
    },
    schemaOptions,
);

const FolderSchema = new mongoose.Schema<IFolder & mongoose.Document>({}, schemaOptions);

const ShortcutSchema = new mongoose.Schema<IShortcut & mongoose.Document>({
    ref: {
        type: 'ObjectId',
        required: true,
        ref: config.mongo.fsObjectsCollectionName,
    },
});

FsObjectSchema.post(/save|update|findOneAndUpdate|insertMany/, errorHandler);
FileSchema.post(/save|update|findOneAndUpdate|insertMany/, errorHandler);
FolderSchema.post(/save|update|findOneAndUpdate|insertMany/, errorHandler);
ShortcutSchema.post(/save|update|findOneAndUpdate|insertMany/, errorHandler);

const FsObjectModel = mongoose.model<IFsObject & mongoose.Document>(
    config.mongo.fsObjectsCollectionName,
    FsObjectSchema,
);
const FileModel = FsObjectModel.discriminator<IFile & mongoose.Document>('file', FileSchema);
const FolderModel = FsObjectModel.discriminator<IFolder & mongoose.Document>('folder', FolderSchema);
const ShortcutModel = FsObjectModel.discriminator<IShortcut & mongoose.Document>('shortcut', ShortcutSchema);

export { FsObjectModel, FileModel, FolderModel, ShortcutModel };
