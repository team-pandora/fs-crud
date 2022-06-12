import * as mongoose from 'mongoose';
import config from '../../config';
import { setDefaultSettings, setErrorHandler } from '../../utils/mongoose';
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
        client: {
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

FsObjectSchema.index({ name: 'text' });
FsObjectSchema.index({ name: 1 });

setDefaultSettings(FsObjectSchema);
setDefaultSettings(FileSchema);
setDefaultSettings(FolderSchema);
setDefaultSettings(ShortcutSchema);

setErrorHandler(FsObjectSchema);
setErrorHandler(FileSchema);
setErrorHandler(FolderSchema);
setErrorHandler(ShortcutSchema);

const FsObjectModel = mongoose.model<IFsObject & mongoose.Document>(
    config.mongo.fsObjectsCollectionName,
    FsObjectSchema,
);
const FileModel = FsObjectModel.discriminator<IFile & mongoose.Document>('file', FileSchema);
const FolderModel = FsObjectModel.discriminator<IFolder & mongoose.Document>('folder', FolderSchema);
const ShortcutModel = FsObjectModel.discriminator<IShortcut & mongoose.Document>('shortcut', ShortcutSchema);

export { FsObjectModel, FileModel, FolderModel, ShortcutModel };
