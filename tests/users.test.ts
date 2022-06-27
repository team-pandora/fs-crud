import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

jest.setTimeout(60000);

const removeFsObjectsCollection = async () =>
    mongoose.connection.collections[config.mongo.fsObjectsCollectionName].deleteMany({});
const removeStatesCollection = async () =>
    mongoose.connection.collections[config.mongo.statesCollectionName].deleteMany({});
const removeQuotasCollection = async () =>
    mongoose.connection.collections[config.mongo.quotasCollectionName].deleteMany({});

describe('Users tests:', () => {
    let app: Express.Application;

    beforeAll(async () => {
        await mongoose.connect(config.mongo.uri);
        await removeFsObjectsCollection();
        await removeStatesCollection();
        await removeQuotasCollection();
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await removeFsObjectsCollection();
        await removeStatesCollection();
        await removeQuotasCollection();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('Create file', () => {
        it('should fail to create file, all the parameters are incorrect', async () => {
            await request(app)
                .post('/api/users/*/fs/file')
                .send({
                    name: 123,
                    parent: 'abc',
                    bucket: 123,
                    size: 107374182401,
                    public: null,
                    client: 'abc',
                })
                .expect(400);
        });
        it('should fail to create file, reached quota limit', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file1',
                    parent: null,
                    bucket: '123',
                    size: 20000,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file2',
                    parent: null,
                    bucket: '123',
                    size: 10737418240,
                    public: false,
                    client: 'drive',
                })
                .expect(400);
        });

        it('should fail to create file, parent not found', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file1',
                    parent: '62655a5dd681ae7e5f9eafe0',
                    bucket: '123',
                    size: 500,
                    public: false,
                    client: 'drive',
                })
                .expect(400);
        });

        it('should fail to create file, parent in trash', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    parent: null,
                    name: 'folder-test',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}/trash`)
                .expect(200);

            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file1',
                    parent: createdFolder.fsObjectId,
                    bucket: '123',
                    size: 500,
                    public: false,
                    client: 'drive',
                })
                .expect(403);
        });

        it('should fail to create file, higher permission than shared folder', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    parent: null,
                    name: 'folder-test',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFolder.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe1/fs/file')
                .send({
                    name: 'file1',
                    parent: createdFolder.fsObjectId,
                    bucket: '123',
                    size: 500,
                    public: false,
                    client: 'drive',
                })
                .expect(403);
        });
        it('should create file successfully', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);
        });
        it('should create 10 files in parallel ', async () => {
            const files: Promise<any>[] = [];
            for (let i = 0; i < 10; i++) {
                files.push(
                    request(app)
                        .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                        .send({
                            name: `file-test-${i}`,
                            parent: null,
                            bucket: 'string',
                            size: 50,
                            public: false,
                            client: 'drive',
                        })
                        .expect(200),
                );
            }
            await Promise.all(files);
            expect(files.length).toBe(10);
        });
    });

    describe('Create folder', () => {
        it('should fail to create folder, all the parameters are incorrect', async () => {
            await request(app).post('/api/users/*/fs/folder').send({ name: 123, parent: '12345678910' }).expect(400);
        });

        it('should create a folder successfully', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    parent: null,
                    name: 'folder-test',
                })
                .expect(200);
        });
    });

    describe('Create shortcut', () => {
        it('should fail to create shortcut, all the parameters are incorrect', async () => {
            await request(app)
                .post('/api/users/*/fs/shortcut')
                .send({
                    name: 123,
                    parent: 'abc',
                    ref: 'abc',
                })
                .expect(400);
        });

        it('should fail to create shortcut, ref file does not exist', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut')
                .send({
                    name: 'shortcut',
                    parent: null,
                    ref: '62655a5dd681ae7e5f9eafef',
                })
                .expect(404);
        });

        it('should create shortcut successfully', async () => {
            const { body: folder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    parent: null,
                    name: 'folder-test',
                })
                .expect(200);

            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut')
                .send({
                    parent: folder.fsObjectId,
                    name: 'shortcut-test',
                    ref: createdFile.fsObjectId,
                })
                .expect(200);
        });
    });

    describe('Restore file from trash', () => {
        it('should fail to restore file from trash, file not found', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file/62655a5dd681ae7e5f9eafe1/restore')
                .expect(404);
        });
        it('should restore file from trash successfully', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}/trash`)
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}/restore`)
                .expect(200);

            const { body: restoredFile } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({ fsObjectId: createdFile.fsObjectId })
                .expect(200);

            expect(restoredFile[0].fsObjectId).toBe(createdFile.fsObjectId);
        });
    });

    describe('Restore folder from trash', () => {
        it('should fail to restore folder from trash, folder not found', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/62655a5dd681ae7e5f9eafe1/restore')
                .expect(404);
        });

        it('should restore folder from trash successfully, (owner and shared).', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFolder.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}/trash`)
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({ fsObjectId: createdFolder.fsObjectId })
                .expect(200);

            expect(result[0].trash).toBe(true);
            expect(result[0].trashRoot).toBe(true);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}/restore`)
                .expect(200);

            const { body: restore } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({ fsObjectId: createdFolder.fsObjectId })
                .expect(200);

            expect(restore[0].trash).toBe(false);
            expect(restore[0].trashRoot).toBe(false);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe1/fs/folder/${createdFolder.fsObjectId}/trash`)
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe1/fs/folder/${createdFolder.fsObjectId}/restore`)
                .expect(200);
        });
    });

    describe('Restore shortcut from trash', () => {
        it('should fail to restore shortcut from trash, shortcut not found', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/62655a5dd681ae7e5f9eafe1/restore')
                .expect(404);
        });

        it('should restore shortcut from trash successfully', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);
            const { body: createdShortcut } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut')
                .send({
                    name: 'shortcut',
                    parent: null,
                    ref: `${createdFolder.fsObjectId}`,
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/${createdShortcut.fsObjectId}/trash`)
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/${createdShortcut.fsObjectId}/restore`)
                .expect(200);

            const { body: restoredShortcut } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({ fsObjectId: createdShortcut.fsObjectId })
                .expect(200);

            expect(restoredShortcut[0].ref).toBe(createdFolder.fsObjectId);
        });
    });

    describe('Share fsObject', () => {
        it('should fail to share a FsObject, fs not found', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/626694a390e68455bbd4dabb/share')
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'write',
                })
                .expect(404);
        });

        it('should fail to share FsObject, higher permission than own', async () => {
            const { body: file } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: shortcutFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut')
                .send({
                    parent: null,
                    name: 'shortcut-test',
                    ref: file.fsObjectId,
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${shortcutFile.fsObjectId}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/d7e4d4e4f7c8e8d4f7c8e58f/fs/${file.fsObjectId}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58e',
                    sharedPermission: 'write',
                })
                .expect(400);
        });

        it('should share a FsObject successfully', async () => {
            const { body: file } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: sharedFsObject } = await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${file.fsObjectId}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);

            const result = await request(app)
                .get('/api/users/d7e4d4e4f7c8e8d4f7c8e58f/states/fsObjects')
                .query({ fsObjectId: file.fsObjectId, permission: sharedFsObject.permission })
                .expect(200);

            expect(result.body[0].fsObjectId).toBe(file.fsObjectId);
            expect(result.body[0].permission).toBe('read');
        });

        it('should create a file from a shared folder and check if created a new state for the owner', async () => {
            const { body: folder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${folder.fsObjectId}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'write',
                })
                .expect(200);

            const { body: createdFile } = await request(app)
                .post('/api/users/d7e4d4e4f7c8e8d4f7c8e58f/fs/file')
                .send({
                    name: 'file-test',
                    parent: folder.fsObjectId,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: ownerState } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({ fsObjectId: createdFile.fsObjectId });

            if (ownerState[0].permission !== 'write') {
                throw new Error('owner of folder should have write permission when a user create a file');
            }
        });
    });

    describe('add fs to favorite', () => {
        it('should fail to add fs to favorite, fs not found', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/626694a390e68455bbd4dabb/favorite')
                .expect(404);
        });

        it('should add fs to favorite successfully', async () => {
            const { body: file } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            await request(app).post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${file.fsObjectId}/favorite`).expect(200);

            const result = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({ fsObjectId: file.fsObjectId })
                .expect(200);

            expect(result.body[0].fsObjectId).toBe(file.fsObjectId);
            expect(result.body[0].favorite).toBe(true);
        });
    });

    describe('Get user quota', () => {
        it('should get quota', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            await request(app).get('/api/users/62655a5dd681ae7e5f9eafe0/quota').expect(200);
        });
    });

    describe('Get states and fsObject', () => {
        it('should get states and fsObject', async () => {
            await request(app).post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder').send({
                name: 'folder-test',
                parent: null,
            });
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}/trash`)
                .expect(200);

            const { body: trashFile } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({ trash: true })
                .expect(200);

            expect(trashFile.length).toEqual(1);
        });
    });

    describe('Get fsObject and states', () => {
        it('should get fsObject and states', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            const { body: folder } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/fsObjects/states')
                .query({ type: 'folder' })
                .expect(200);

            expect(folder.length).toEqual(1);
        });
    });

    describe('Get the hierarchy of fsObject ', () => {
        it('should fail to get the hierarchy of fsObject, fs not found', async () => {
            await request(app)
                .get(`/api/users/62655a5dd681ae7e5f9eafe0/fs/62655a5dd681ae7e5f9eafe1/hierarchy`)
                .expect(404);
        });

        it('should get hierarchy of fsObject successfully', async () => {
            const { body: folder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            const { body: folderTwo } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test-two',
                    parent: folder.fsObjectId,
                })
                .expect(200);

            const { body: file } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: folderTwo.fsObjectId,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: fileHierarchy } = await request(app)
                .get(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${file.fsObjectId}/hierarchy`)
                .expect(200);

            expect(fileHierarchy.length).toBe(2);
        });
    });

    describe('Update file', () => {
        it('should fail update the file, file not found', async () => {
            await request(app)
                .patch('/api/users/62655a5dd681ae7e5f9eafe0/fs/file/62655a5dd681ae7e5f9eafe1')
                .send({
                    name: 'test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                })
                .expect(404);
        });

        it('should fail update the file, permission denied', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFile.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app)
                .patch(`/api/users/62655a5dd681ae7e5f9eafe1/fs/file/${createdFile.fsObjectId}`)
                .send({
                    name: 'test',
                })
                .expect(403);
        });

        it('should update file', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: updatedFile } = await request(app)
                .patch(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}`)
                .send({
                    name: 'file-test-updated',
                })
                .expect(200);

            expect(updatedFile.name).toBe('file-test-updated');

            const { body: updatedFileSize } = await request(app)
                .patch(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}`)
                .send({
                    size: 500,
                })
                .expect(200);

            expect(updatedFileSize.size).toBe(500);
        });
    });

    describe('Update folder', () => {
        it('should fail update the file, folder not found', async () => {
            await request(app)
                .patch('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/62655a5dd681ae7e5f9eafe1')
                .send({
                    name: 'test',
                })
                .expect(404);
        });

        it('should fail update the folder, permission denied', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFolder.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app)
                .patch(`/api/users/62655a5dd681ae7e5f9eafe1/fs/folder/${createdFolder.fsObjectId}`)
                .send({
                    name: 'test-updated',
                })
                .expect(403);
        });

        it('should update folder', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            const { body: updatedFolder } = await request(app)
                .patch(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}`)
                .send({
                    name: 'folder-test-updated',
                })
                .expect(200);

            expect(updatedFolder.name).toBe('folder-test-updated');
        });
    });

    describe('Update shortcut', () => {
        it('should fail update the shortcut, shortcut not found', async () => {
            await request(app)
                .patch('/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/62655a5dd681ae7e5f9eafe1')
                .send({
                    name: 'test',
                })
                .expect(404);
        });

        it('should update user shortcut successfully', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: createdShortcut } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut')
                .send({
                    name: 'shortcut-test',
                    parent: null,
                    ref: createdFile.fsObjectId,
                })
                .expect(200);

            const { body: updatedShortcut } = await request(app)
                .patch(`/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/${createdShortcut.fsObjectId}`)
                .send({
                    name: 'shortcut-test-updated',
                })
                .expect(200);

            expect(updatedShortcut.name).toBe('shortcut-test-updated');
        });
    });

    describe('Delete shared fsObject', () => {
        it('should fail delete shared fsObject, fsObject not found', async () => {
            await request(app)
                .delete('/api/users/62655a5dd681ae7e5f9eafe0/fs/626e6c3c4560b39744dcd248/share')
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                })
                .expect(404);
        });

        it('should fail delete shared fsObject, fsObject is not shared with provided user', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFile.fsObjectId}/share`)
                .send({
                    userId: '62655a5dd681ae7e5f9eafe1',
                })
                .expect(400);
        });

        it('should fail delete shared fsObject, permission denied', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFile.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFile.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe2',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe1/fs/${createdFile.fsObjectId}/share`)
                .send({
                    userId: '62655a5dd681ae7e5f9eafe2',
                })
                .expect(400);
        });

        it('should unshare fsObject', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                });

            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: createdFolder.fsObjectId,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: sharedFileState } = await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFolder.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'write',
                })
                .expect(200);

            expect(sharedFileState.permission).toBe('write');

            const { body: deletedState } = await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFolder.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe1/states/fsObjects')
                .query({
                    stateId: deletedState._id,
                })
                .expect(200);

            expect(result.length).toBe(0);
        });
    });

    describe('Delete fs from favorite', () => {
        it('should fail delete fs from favorite, fs not found', async () => {
            await request(app).delete('/api/users/62655a5dd681ae7e5f9eafe0/fs/626e6c3c4560b39744dcd248/favorite');
            expect(404);
        });

        it('should delete fs from favorite successfully', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                });

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFolder.fsObjectId}/favorite`)
                .expect(200);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFolder.fsObjectId}/favorite`)
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({ fsObjectId: createdFolder.fsObjectId })
                .expect(200);

            expect(result[0].favorite).toBe(false);
        });
    });

    describe('Delete file', () => {
        it('should delete file', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}/trash`)
                .expect(200);
        });

        it('should delete shared file', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: sharedFileState } = await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFile.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'write',
                })
                .expect(200);

            expect(sharedFileState.permission).toBe('write');

            const { body: deleteFile } = await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe1/fs/file/${createdFile.fsObjectId}/trash`)
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe1/states/fsObjects')
                .query({
                    stateId: deleteFile._id,
                })
                .expect(200);

            expect(result.length).toBe(1);
            expect(result[0].trash).toBe(true);
        });
    });

    describe('Delete folder', () => {
        it('should fail to delete folder, folder not found', async () => {
            await request(app)
                .delete('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/62655a5dd681ae7e5f9eafe1')
                .expect(404);
        });

        it('should delete folder', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}/trash`)
                .expect(200);
        });

        it('should delete shared folder', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: createdFolder.fsObjectId,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: sharedFolderState } = await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFolder.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'write',
                })
                .expect(200);

            expect(sharedFolderState.permission).toBe('write');

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe1/fs/folder/${createdFolder.fsObjectId}/trash`)
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe1/states/fsObjects')
                .query({
                    fsObjectId: createdFolder.fsObjectId,
                })
                .expect(200);

            expect(result.length).toBe(1);
            expect(result[0].trash).toBe(true);
        });
    });

    describe('Delete shortcut', () => {
        it('should fail to delete shortcut, shortcut not found', async () => {
            await request(app)
                .delete('/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/62655a5dd681ae7e5f9eafe1')
                .expect(404);
        });

        it('should delete shortcut', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: createdShortcut } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut')
                .send({
                    name: 'shortcut-test',
                    parent: null,
                    ref: createdFile.fsObjectId,
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/${createdShortcut.fsObjectId}/trash`)
                .expect(200);
        });

        it('should delete shared shortcut', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: sharedFile } = await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFile.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'write',
                })
                .expect(200);

            const { body: createdShortcut } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe1/fs/shortcut')
                .send({
                    name: 'shortcut-test',
                    parent: null,
                    ref: sharedFile.fsObjectId,
                })
                .expect(200);

            const { body: deleteShortcut } = await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe1/fs/shortcut/${createdShortcut.fsObjectId}/trash`)
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe1/states/fsObjects')
                .query({
                    stateId: deleteShortcut._id,
                    userId: '62655a5dd681ae7e5f9eafe1',
                    type: 'shortcut',
                })
                .expect(200);

            expect(result.length).toBe(1);
            expect(result[0].trash).toBe(true);
        });

        it('should delete shortcuts of file that is no longer shared with user', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: sharedFile } = await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFile.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe1/states/fsObjects')
                .query({ fsObjectId: createdFile.fsObjectId, permission: sharedFile.permission })
                .expect(200);

            const { body: createdShortcut } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut')
                .send({
                    parent: null,
                    name: 'shortcut',
                    ref: createdFile.fsObjectId,
                })
                .expect(200);
            expect(createdShortcut).toBeDefined();

            const { body: deletedState } = await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFile.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe1/states/fsObjects')
                .query({
                    stateId: deletedState._id,
                })
                .expect(200);
            expect(result.length).toBe(0);

            const { body: sharedUserFileShortcuts } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe1/fsObjects/states')
                .query({ ref: createdFile.fsObjectId, userId: '62655a5dd681ae7e5f9eafe1' })
                .expect(200);

            expect(sharedUserFileShortcuts.length).toBe(0);
        });

        it('should delete shortcuts of folder that is no longer shared with user', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: sharedFolder } = await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFolder.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe1/states/fsObjects')
                .query({ fsObjectId: createdFolder.fsObjectId, permission: sharedFolder.permission })
                .expect(200);

            const { body: createdShortcut } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut')
                .send({
                    parent: null,
                    name: 'shortcut',
                    ref: createdFolder.fsObjectId,
                })
                .expect(200);
            expect(createdShortcut).toBeDefined();

            const { body: deletedState } = await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFolder.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe1/states/fsObjects')
                .query({
                    stateId: deletedState._id,
                })
                .expect(200);
            expect(result.length).toBe(0);

            const { body: sharedUserFolderShortcuts } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe1/fsObjects/states')
                .query({ ref: createdFolder.fsObjectId, userId: '62655a5dd681ae7e5f9eafe1' })
                .expect(200);

            expect(sharedUserFolderShortcuts.length).toBe(0);
        });
    });

    describe('Delete trash', () => {
        it('should fail to delete trash, fs not found ', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: createdFolder.fsObjectId,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: createdFolder2 } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test2',
                    parent: createdFolder.fsObjectId,
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}/trash`)
                .expect(200);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}/trash`)
                .expect(404);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder2.fsObjectId}/trash`)
                .expect(404);
        });

        it('should delete fsObject from trash. (owner, and not owner)', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: createdFolder.fsObjectId,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFolder.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'write',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe1/fs/folder/${createdFolder.fsObjectId}/trash`)
                .expect(200);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe1/fs/folder/${createdFolder.fsObjectId}/trash`)
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}/trash`)
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({
                    stateId: createdFolder._id,
                })
                .expect(200);

            expect(result.length).toBe(2);
            expect(result[0].trashRoot).toBe(true);
            expect(result[1].trashRoot).toBe(false);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}/trash`)
                .expect(200);

            const { body: result2 } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({
                    stateId: createdFolder._id,
                })
                .expect(200);

            expect(result2.length).toBe(0);
        });

        it('should delete shared fsObject from trash', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: sharedFile } = await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFile.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFile.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe2',
                    sharedPermission: 'write',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe1/fs/file/${sharedFile.fsObjectId}/trash`)
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe1/states/fsObjects')
                .query({
                    stateId: sharedFile._id,
                })
                .expect(200);

            expect(result.length).toBe(1);
            expect(result[0].trash).toBe(true);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe1/fs/file/${sharedFile.fsObjectId}/trash`)
                .expect(200);

            const { body: result2 } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({
                    stateId: sharedFile._id,
                })
                .expect(200);

            expect(result2.length).toBe(0);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}/trash`)
                .expect(200);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}/trash`)
                .expect(200);
        });

        it('should delete folder from trash', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}/trash`)
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({
                    fsObjectId: createdFolder.fsObjectId,
                })
                .expect(200);

            expect(result.length).toBe(1);
            expect(result[0].trash).toBe(true);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}/trash`)
                .expect(200);

            const { body: result2 } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({
                    stateId: createdFolder._id,
                })
                .expect(200);

            expect(result2.length).toBe(0);
        });

        it('should delete shortcut from trash', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    bucket: 'string',
                    size: 50,
                    public: false,
                    client: 'drive',
                })
                .expect(200);

            const { body: createdShortcut } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut')
                .send({
                    name: 'shortcut-test',
                    parent: null,
                    ref: createdFile.fsObjectId,
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/${createdShortcut.fsObjectId}/trash`)
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({
                    stateId: createdShortcut._id,
                    type: 'shortcut',
                })
                .expect(200);

            expect(result.length).toBe(1);
            expect(result[0].trash).toBe(true);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/${createdShortcut.fsObjectId}/trash`)
                .expect(200);

            const { body: result2 } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({
                    stateId: createdShortcut._id,
                    type: 'shortcut',
                })
                .expect(200);

            expect(result2.length).toBe(0);
        });
    });
});
