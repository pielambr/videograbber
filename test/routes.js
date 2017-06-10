/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-expressions */
process.env.NODE_ENV = 'test';

const mocha = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');

const it = mocha.it;
const describe = mocha.describe;

chai.use(chaiHttp);
chai.should();

describe('GET /', () => {
  it('should return the index page', (done) => {
    chai.request(server)
      .get('/')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html;
        done();
      });
  });
});

describe('GET /files', () => {
  it('should return 0 files', (done) => {
    chai.request(server)
      .get('/files')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
        res.body.files.should.be.a('array');
        res.body.files.length.should.be.eql(0);
        done();
      });
  });
});

describe('POST /files', () => {
  it('should not create file without site_url', (done) => {
    chai.request(server)
      .post('/files/')
      .end((err, res) => {
        res.should.have.status(400);
        done();
      });
  });

  it('should fail on invalid url', (done) => {
    chai.request(server)
      .post('/files/')
      .send({ site_url: 'gibberish' })
      .type('form')
      .end((err, res) => {
        res.should.have.status(400);
        done();
      });
  });

  it('should return OK on valid url', (done) => {
    chai.request(server)
      .post('/files/')
      .send({ site_url: 'https://www.wowza.com/products/player' })
      .type('form')
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});
