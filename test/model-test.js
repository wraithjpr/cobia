'use strict';

/* eslint-disable no-invalid-this, no-magic-numbers, no-unused-expressions */

const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const model = require('../src/model/model.js');

describe('model.js tests', function () {
  describe('getListItems', function () {
    it('should return a promise resolving to a result object containing an array of items.', function (done) {
      const promise = model.getListItems();

      expect(promise).to.be.a('promise').that.is.fulfilled;

      promise.then(function (result) {
        expect(result).to.have.property('found', true);
        expect(result).to.have.property('type', 'list-items');
        expect(result).to.have.property('documents').that.is.an('array').that.is.not.empty;

        return done();
      }, done);
    });
  });
  describe('createEvent', function () {
    it('should return a promise resolving to a result object containing the uri of the newly created event.', function (done) {
      const doc = {
        captureType: 'monitor',
        method: 'GET',
        url: 'https://mochajs.org/',
        userEmail: 'james.p.r.wraith@gmail.com',
        dateTime: new Date(),
        resourceType: 'main_frame',
        tabId: 264,
        requestId: '5630',
        origin: 'mocha test'
      };

      this.timeout(500);

      const promise = model.createEvent(doc);

      expect(promise).to.be.a('promise').that.is.fulfilled;

      promise.then(function (result) {
        expect(result).to.have.property('created', true);
        expect(result).to.have.property('type', 'events');
        expect(result).to.have.property('insertedCount', 1);
        expect(result).to.have.property('_id').that.is.a('string');
        expect(result._id).to.not.be.empty;  // eslint-disable-line no-underscore-dangle

        return done();
      }, done);
    });
  });
});
