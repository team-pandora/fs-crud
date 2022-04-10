/* eslint-disable no-underscore-dangle */
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

jest.setTimeout(30000);

const removeUploadCollection = async () =>
    mongoose.connection.collections[config.mongo.uploadsCollectionName].deleteMany({});

describe('upload tests', () => {
    let app: Express.Application;

    beforeAll(async () => {
        await mongoose.connect(config.mongo.uri);
        await removeUploadCollection();
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await removeUploadCollection();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('/api/uploads', () => {
        describe('POST', () => {
            it('should fail validation,', () => {
                return request(app)
                    .post('/api/upload')
                    .send({
                        name: 'upload',
                        parent: 'abc',
                        uploadedBytes: 123,
                        key: 'abc',
                        bucket: 'abc',
                        size: 123,
                        source: 'abc',
                    })
                    .expect(400);
            });

            it('should pass validation, create new upload', () => {
                return request(app)
                    .post('/api/uploads')
                    .send({
                        name: 'upload',
                        parent: '5d7e4d4e4f7c8e8d4f7c8e8d',
                        uploadedBytes: 123,
                        key: 'abcd',
                        bucket: 'abc',
                        size: 123,
                        source: 'drive',
                    })
                    .expect(200);
            });
        });

        describe('GET', () => {
            const upload1 = {
                name: 'upload1',
                parent: '5d7e4d4e4f7c8e8d4f7c8e8d',
                uploadedBytes: 123,
                key: 'abc',
                bucket: 'ab',
                size: 123,
                source: 'drive',
            };

            const upload2 = {
                name: 'upload2',
                parent: '5d7e4d4e4f7c8e8d4f7c8e8d',
                uploadedBytes: 321,
                key: 'abcde',
                bucket: 'ab',
                size: 123,
                source: 'dropbox',
            };

            it('should pass validation, get all the uploads', () => {
                return request(app).get('/api/upload').expect(200);
            });

            it('should pass validation, get all the types of uploads', async () => {
                await request(app)
                    .post('/api/uploads')
                    .send({ ...upload1, parent: '5d7e4d4e4f7c8e8d4f7c8e8a' });

                await request(app)
                    .post('/api/uploads')
                    .send({ ...upload1, parent: '5d7e4d4e4f7c8e8d4f7c8e8b', source: 'drive' });

                await request(app)
                    .post('/api/uploads')
                    .send({ ...upload2, parent: '5d7e4d4e4f7c8e8d4f7c8e8c' });

                const { body: getUpload1 } = await request(app)
                    .get('/api/uploads?parent=5d7e4d4e4f7c8e8d4f7c8e8d&source=drive&name=upload1&key=abc')
                    .expect(200);

                expect(getUpload1).toHaveLength(1);
                expect(getUpload1).toEqual([
                    {
                        ...upload1,
                        _id: expect.any(String),
                        parent: '5d7e4d4e4f7c8e8d4f7c8e8a',
                        createdAt: expect.anything(),
                        updatedAt: expect.anything(),
                    },
                ]);

                const { body: getSourceDrive } = await request(app)
                    .get('/api/uploads?parent=5d7e4d4e4f7c8e8d4f7c8e8d&source=drive&name=upload1&key=abc')
                    .expect(200);
                expect(getSourceDrive).toHaveLength(1);
                expect(getSourceDrive[0].source).toEqual('drive');

                const { body: getUpload2 } = await request(app)
                    .get('/api/uploads?parent=5d7e4d4e4f7c8e8d4f7c8e8d&source=dropbox&name=upload2&key=abcde')
                    .expect(200);
                expect(getUpload2).toHaveLength(1);
                expect(getUpload2).toEqual([
                    {
                        ...upload2,
                        _id: expect.any(String),
                        parent: '5d7e4d4e4f7c8e8d4f7c8e8a',
                        createdAt: expect.anything(),
                        updatedAt: expect.anything(),
                    },
                ]);
            });
        });
    });
});
