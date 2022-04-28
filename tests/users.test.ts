import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

jest.setTimeout(30000);

const removeFsObjectsCollection = async () =>
    mongoose.connection.collections[config.mongo.fsObjectsCollectionName].deleteMany({});
const removeStateCollection = async () =>
    mongoose.connection.collections[config.mongo.statesCollectionName].deleteMany({});

describe('users tests:', () => {
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
        it('should fail to create file, the parameters are incorrect', async () => {
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
    });

    // describe('Create 10 files with for loop and async', () => {
    //     it('should create 10 files', async () => {
    //         const promises: Promise<any>[] = [];
    //         for (let i = 0; i < 10; i++) {
    //             promises.push(
    //                 request(app)
    //                     .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/file')
    //                     .send({
    //                         name: `file-test-${i}`,
    //                         parent: null,
    //                         key: 'string',
    //                         bucket: 'string',
    //                         size: 50,
    //                         public: false,
    //                         source: 'drive',
    //                     })
    //                     .expect(200),
    //             );
    //         }
    //         await Promise.all(promises);
    //     });
    // });

    describe('Create folder', () => {
        it('should fail to create a folder, the parameters are incorrect', async () => {
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
        it('should fail to create shortcut, the parameters are incorrect', async () => {
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
            const createdFile = await request(app)
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
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.body.fsObjectId}`)
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/file/${createdFile.body.fsObjectId}/restore`)
                .expect(200);
        });
    });

    describe('Restore folder from trash', () => {
        it('should restore folder from trash', async () => {
            const createdFolder = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.body.fsObjectId}`)
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/folder/${createdFolder.body.fsObjectId}/restore`)
                .expect(200);
        });
    });

    describe('Restore shortcut from trash', () => {
        it('should restore shortcut from trash', async () => {
            const createdFolder = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/folder')
                .send({
                    name: 'folder-test',
                    parent: null,
                })
                .expect(200);
            const createdShortcut = await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut')
                .send({
                    name: 'shortcut',
                    parent: null,
                    ref: `${createdFolder.body.fsObjectId}`,
                })
                .expect(200);

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/${createdShortcut.body.fsObjectId}`)
                .expect(200);

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/shortcut/${createdShortcut.body.fsObjectId}/restore`)
                .expect(200);
        });
    });

    describe('Share fsObject', () => {
        it('should fail to share a FsObject', async () => {
            await request(app)
                .post('/api/users/62655a5dd681ae7e5f9eafe0/fs/626694a390e68455bbd4dabb/share')
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'write',
                })
                .expect(404);
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

            await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${file.fsObjectId}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);
        });
    });

    describe('Get the quota of user', () => {
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

            await request(app)
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
        it('should delete shared fsObject', async () => {
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

            const { body: createdShareFile } = await request(app)
                .post(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFile.fsObjectId}/share`)
                .send({
                    sharedUserId: '62655a5dd681ae7e5f9eafe1',
                    sharedPermission: 'write',
                })
                .expect(200);
            expect(createdShareFile.permission).toBe('write');

            await request(app)
                .delete(`/api/users/62655a5dd681ae7e5f9eafe0/fs/${createdFile.fsObjectId}/share`)
                .send({
                    userId: '62655a5dd681ae7e5f9eafe1',
                })
                .expect(200);
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
    });
});
