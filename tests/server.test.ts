import * as request from 'supertest';
import Server from '../src/express/server';

jest.setTimeout(30000);

describe('server tests', () => {
    let app: Express.Application;

    beforeAll(async () => {
        app = Server.createExpressApp();
    });

    describe('/isAlive', () => {
        it('should return alive', async () => {
            const response = await request(app).get('/isAlive').expect(200);
            expect(response.text).toBe('alive');
        });
    });

    describe('/unknownRoute', () => {
        it('should return status code 404', () => {
            return request(app).get('/unknownRoute').expect(404);
        });
    });
});
