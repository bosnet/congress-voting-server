const request = require('supertest');
const { expect } = require('chai');
const crypto = require('crypto');
const cryptoRandomString = require('crypto-random-string');

const app = require('../../app');
const { Membership } = require('../../models/index');

describe('web:users', () => {
  describe('GET /login', () => {
    it('should show login page', async () => {
      await request(app)
        .get('/login?source=congress_forum')
        .set('Accept', 'text/html')
        .expect('Content-Type', /html/)
        .expect(200, /login/);
    });
  });

  describe('POST /login', () => {
    let address;

    before(async () => {
      address = cryptoRandomString(56);

      await Membership.register({
        publicAddress: address,
        status: Membership.Status.active.name,
      });
    });

    after(async () => {
      await Membership.destroy({ where: {}, truncate: true });
    });

    it('should login the user with session when providing membership address', async () => {
      await request(app)
        .post('/login')
        .send({ source: 'congress_forum', address })
        .set('Accept', 'text/html')
        .expect('Content-Type', /text\/html/)
        .expect('set-cookie', /boscoin.sid/);
    });

    it('should redirect the user to vanilla forum after logged-in the user', async () => {
      await request(app)
        .post('/login')
        .send({ source: 'congress_forum', address })
        .set('Accept', 'text/html')
        .expect('Content-Type', /html/)
        .expect(302)
        .expect('Location', 'https://boscoin.vanillacommunity.com/sso?Target=/categories');
    });
  });

  describe('GET /logout', () => {
    let address;

    before(async () => {
      address = cryptoRandomString(56);

      await Membership.register({
        publicAddress: address,
        status: Membership.Status.active.name,
      });
    });

    after(async () => {
      await Membership.destroy({ where: {}, truncate: true });
    });

    it('should logout logged-in user', async () => {
      const client = request.agent(app);
      await client
        .post('/login')
        .send({ source: 'congress_forum', address })
        .expect(302);

      await client
        .get('/logout')
        .expect(302);

      await client
        .get('/login?source=congress_forum')
        .set('Accept', 'text/html')
        .expect('Content-Type', /html/)
        .expect(200, /login/);
    });
  });

  describe('GET /vanilla/authentication', () => {
    let address;
    const sha256 = str => crypto.createHash('sha256').update(str, 'utf8').digest('hex');
    const ts = (new Date()).getTime();
    const query = new URLSearchParams({
      client_id: process.env.VANILLA_CLIENT_ID,
      timestamp: ts,
      signature: sha256(`${ts}${process.env.VANILLA_SECRET}`),
      callback: 'my_jsonp_callback',
    });

    before(async () => {
      address = cryptoRandomString(56);

      await Membership.register({
        publicAddress: address,
        status: Membership.Status.active.name,
      });
    });

    after(async () => {
      await Membership.destroy({ where: {}, truncate: true });
    });

    it('should return empty jsonp data without login', async () => {
      const client = request.agent(app);
      await client
        .get(`/vanilla/authentication?${query.toString()}`)
        .set('Accept', 'application/javascript')
        .expect('Content-Type', /application\/javascript/)
        .expect(200)
        .then((res) => {
          expect(res.text).to.equal('my_jsonp_callback({"name": ""})');
        });
    });

    it('should return jsonp data with login', async () => {
      const client = request.agent(app);
      await client
        .post('/login')
        .send({ source: 'congress_forum', address })
        .expect(302);

      await client
        .get(`/vanilla/authentication?${query.toString()}`)
        .set('Accept', 'application/javascript')
        .expect('Content-Type', /application\/javascript/)
        .expect(200)
        .then((res) => {
          const data = {
            email: `${address}@boscoin.io`,
            name: address.substr(0, 7),
            uniqueid: address,
          };
          const params = new URLSearchParams(data);
          const sig = sha256(`${params.toString()}${process.env.VANILLA_SECRET}`);

          const actual = Object.assign({}, data, {
            client_id: process.env.VANILLA_CLIENT_ID,
            signature: sig,
          });
          expect(res.text).to.equal(`my_jsonp_callback(${JSON.stringify(actual)})`);
        });
    });
  });
});
