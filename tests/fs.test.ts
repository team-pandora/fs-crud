/* eslint-disable no-underscore-dangle */
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

jest.setTimeout(30000);

const removeStateCollection = async () =>
    mongoose.connection.collections[config.mongo.fsObjectsCollectionName].deleteMany({});

describe('fsObjects tests', () => {
    let app: Express.Application;

    beforeAll(async () => {
        await mongoose.connect(config.mongo.uri);
        await removeStateCollection();
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await removeStateCollection();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('/api/fs/file', () => {
        describe('POST', () => {
            it('should fail validation,', async () => {
                await request(app).post('/api/fs/file').send({}).expect(400);
            });
            it('should pass validation,', async () => {
                await request(app)
                    .post('/api/fs/file')
                    .send({
                        name: 'abc',
                        key: 'abc',
                        bucket: 'abc',
                        size: 123,
                        public: true,
                    })
                    .expect(200);
            });
        });
    });
    describe('/api/fs/folder', () => {
        describe('POST', () => {
            it('should fail validation,', async () => {
                await request(app).post('/api/fs/folder').send({}).expect(400);
            });
            it('should pass validation,', async () => {
                await request(app)
                    .post('/api/fs/folder')
                    .send({
                        name: 'abc',
                    })
                    .expect(200);
            });
        });
    });
    describe('/api/fs/shortcut', () => {
        describe('POST', () => {
            it('should fail validation,', async () => {
                await request(app).post('/api/fs/shortcut').send({}).expect(400);
            });
            it('should create a shortcut with the ref of the file', async () => {
                const file = await request(app)
                    .post('/api/fs/file')
                    .send({
                        name: 'abc',
                        parent: null,
                        key: 'abc',
                        bucket: 'abc',
                        size: 123,
                        public: true,
                    })
                    .expect(200);
                // take the id from the response body and use it in the shortcut
                const shortcut = await request(app)
                    .post('/api/fs/shortcut')
                    .send({
                        name: 'abc',
                        ref: new mongoose.Types.ObjectId(file.body._id),
                    })
                    .expect(200);
                expect(shortcut.body.ref).toBe(file.body._id);
            });
        });
    });
});
