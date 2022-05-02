import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

jest.setTimeout(60000);

const removeFsObjectsCollection = async () =>
    mongoose.connection.collections[config.mongo.fsObjectsCollectionName].deleteMany({});
const removeStateCollection = async () =>
    mongoose.connection.collections[config.mongo.statesCollectionName].deleteMany({});

describe('Users tests:', () => {
    let app: Express.Application;

    beforeAll(async () => {
        await mongoose.connect(config.mongo.uri);
        await removeFsObjectsCollection();
        await removeStateCollection();
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await removeFsObjectsCollection();
        await removeStateCollection();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('Create file', () => {
        it('should not create file, all the parameters are incorrect', async () => {
            await request(app)
                .post('/api/users/*/fs/file')
                .send({
                    name: 123,
                    parent: 'abc',
                    key: 123,
                    bucket: 123,
                    size: 107374182401,
                    public: null,
                    source: 'abc',
                })
                .expect(400);
        });
        it('should create a file', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
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
                            key: 'string',
                            bucket: 'string',
                            size: 50,
                            public: false,
                            source: 'drive',
                        })
                        .expect(200),
                );
            }
            await Promise.all(files);
            expect(files.length).toBe(10);
        });
    });

    describe('Create folder', () => {
        it('should not create a folder, all the parameters are incorrect', async () => {
            await request(app).post('/api/users/*/fs/folder').send({ name: 123, parent: '12345678910' }).expect(400);
        });

        it('should create a folder', async () => {
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
        it('should not create shortcut, all the parameters are incorrect', async () => {
            await request(app)
                .post('/api/users/*/fs/shortcut')
                .send({
                    name: 123,
                    parent: 'abc',
                    ref: 'abc',
                })
                .expect(400);
        });

        it('should create a shortcut', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe1/fs/shortcut')
                .send({
                    parent: null,
                    name: 'shortcut-test',
                    ref: createdFile.fsObjectId,
                })
                .expect(200);
        });
    });

    describe('Restore file from trash', () => {
        it('should restore file from trash', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}`)
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
        it('should restore folder from trash', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}`)
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}/restore`)
                .expect(200);

            const { body: restoredFolder } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({ fsObjectId: createdFolder.fsObjectId })
                .expect(200);

            expect(restoredFolder[0].fsObjectId).toBe(createdFolder.fsObjectId);
        });
    });

    describe('Restore shortcut from trash', () => {
        it('should restore shortcut from trash', async () => {
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
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/${createdShortcut.fsObjectId}`)
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
        it('should not share a FsObject', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/626694a390e68455bbd4dabb/share')
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'write',
                })
                .expect(404);
        });

        it('should not share FsObject, higher permission than own', async () => {
            const { body: file } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${file.fsObjectId}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'owner',
                })
                .expect(400);
        });

        it('should share a FsObject', async () => {
            const { body: file } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
                })
                .expect(200);

            const { body: sharedFsObject } = await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${file.fsObjectId}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app)
                .get('/api/users/d7e4d4e4f7c8e8d4f7c8e58f/states/fsObjects')
                .query({ fsObjectId: file.fsObjectId, permission: sharedFsObject.permission })
                .expect(200);
        });
    });

    describe('Get user quota', () => {
        it('should get quota', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
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
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .patch(`/api/users/62655a5dd681ae7e5f9eafe0/states/${createdFile.stateId}`)
                .send({
                    trash: true,
                })
                .expect(200);

            const { body: trashFile } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({
                    trash: true,
                    fsObjectId: createdFile.fsObjectId,
                })
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
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
                })
                .expect(200);

            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            const { body: folder } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({
                    type: 'folder',
                    fsObjectId: createdFolder.fsObjectId,
                })
                .expect(200);

            expect(folder.length).toEqual(1);
        });
    });

    describe('Get the hierarchy of fsObject ', () => {
        it('should get hierarchy of fsObject', async () => {
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
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
                })
                .expect(200);

            const { body: fileHierarchy } = await request(app)
                .get(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${file.fsObjectId}/hierarchy`)
                .expect(200);

            expect(fileHierarchy.length).toBe(2);
        });
    });

    describe('Update state', () => {
        it('should update state', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
                })
                .expect(200);

            const { body: updatedState } = await request(app)
                .patch(`/api/users/62655a5dd681ae7e5f9eafe0/states/${createdFile.stateId}`)
                .send({
                    favorite: true,
                })
                .expect(200);

            expect(updatedState.favorite).toBe(true);
        });
    });

    describe('Update file', () => {
        it('should update file', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
                })
                .expect(200);

            const { body: updatedFile } = await request(app)
                .patch(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}`)
                .send({
                    name: 'file-test-updated',
                })
                .expect(200);

            expect(updatedFile.name).toBe('file-test-updated');
        });
    });

    describe('Update folder', () => {
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
        it('should update user shortcut', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
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
        it('should delete shared fsObject by owner', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
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

            const { body: deletedState } = await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFile.fsObjectId}/share`)
                .send({
                    userId: '62655a5dd681ae7e5f9eafe1',
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

    describe('Delete file', () => {
        it('should delete file', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}`)
                .expect(200);
        });

        it('should delete shared file', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
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
                .delete(`/api/users/62655a5dd681ae7e5f9eafe1/fs/file/${createdFile.fsObjectId}`)
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
        it('should delete folder', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}`)
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

            const { body: sharedFolderState } = await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFolder.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'write',
                })
                .expect(200);

            expect(sharedFolderState.permission).toBe('write');

            const { body: deleteFolder } = await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe1/fs/folder/${createdFolder.fsObjectId}`)
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe1/states/fsObjects')
                .query({
                    stateId: deleteFolder._id,
                })
                .expect(200);

            expect(result.length).toBe(1);
            expect(result[0].trash).toBe(true);
        });
    });

    describe('Delete shortcut', () => {
        it('should delete shortcut', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
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
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/${createdShortcut.fsObjectId}`)
                .expect(200);
        });

        it('should delete shared shortcut', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
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

            const { body: deleteShortcut } = await request(app).delete(
                `/api/users/62655a5dd681ae7e5f9eafe1/fs/shortcut/${createdShortcut.fsObjectId}`,
            );

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
    });

    describe('Delete trash', () => {
        it('should delete fsObject from trash', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}`)
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({
                    stateId: createdFile._id,
                })
                .expect(200);

            expect(result.length).toBe(1);
            expect(result[0].trash).toBe(true);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.fsObjectId}`)
                .expect(200);

            const { body: result2 } = await request(app)
                .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
                .query({
                    stateId: createdFile._id,
                })
                .expect(200);

            expect(result2.length).toBe(0);
        });

        // it('should delete folder from trash', async () => {
        //     const { body: createdFolder } = await request(app)
        //         .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
        //         .send({
        //             name: 'folder-test',
        //             parent: null,
        //         })
        //         .expect(200);

        //     await request(app)
        //         .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}`)
        //         .expect(200);

        //     const { body: result } = await request(app)
        //         .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
        //         .query({
        //             fsObjectId: createdFolder.fsObjectId,
        //         })
        //         .expect(200);

        //     expect(result.length).toBe(1);
        //     expect(result[0].trash).toBe(true);

        //     await request(app)
        //         .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.fsObjectId}`)
        //         .expect(200);

        //     const { body: result2 } = await request(app)
        //         .get('/api/users/62655a5dd681ae7e5f9eafe0/states/fsObjects')
        //         .query({
        //             stateId: createdFolder._id,
        //         })
        //         .expect(200);

        //     expect(result2.length).toBe(0);
        // });

        it('should delete shortcut from trash', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
                .send({
                    name: 'file-test',
                    parent: null,
                    key: 'string',
                    bucket: 'string',
                    size: 50,
                    public: false,
                    source: 'drive',
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
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/${createdShortcut.fsObjectId}`)
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
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/${createdShortcut.fsObjectId}`)
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
