'use strict';

/* eslint-disable no-unused-expressions */

const chai = require('chai');
const expect = chai.expect;                                      // eslint-disable-line no-unused-vars
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
});
