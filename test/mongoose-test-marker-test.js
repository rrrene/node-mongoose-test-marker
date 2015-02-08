'use strict';

var os = require('os');
var mongoose = require('mongoose'),
    Bluebird = require('bluebird');
var should = require('chai').should();
var test_marker = require('../index.js');
var Model = require('../test-util/test-model.js');
var Schema = mongoose.Schema,
    internals = {};

describe('mongoose-test-marker-test', function() {
  var hostname = os.hostname();

  describe('Plugin tests', function() {
    it('should add the `__test` field to the model', function() {
      var schema = new Schema({ foo: String }).plugin(test_marker);
      schema.paths.should.have.property('__test.pid');
      schema.paths.should.have.property('__test.hostname');
      schema.paths.should.have.property('__test.filename');
    });

    it('should add the `removeAllTestDocuments` method to the model', function() {
      var schema = new Schema({ bar: String }).plugin(test_marker);
      schema.statics.should.have.property('removeAllTestDocuments');
      schema.statics.removeAllTestDocuments.should.be.a('function');
    });

    it('should add the `removeTaggedTestDocuments` method to the model', function() {
      var schema = new Schema({ baz: String }).plugin(test_marker);
      schema.statics.should.have.property('removeTaggedTestDocuments');
      schema.statics.removeTaggedTestDocuments.should.be.a('function');
    });

    it('should add the `setTestFile` method to the model', function() {
      var schema = new Schema({ baz: String }).plugin(test_marker);
      schema.statics.should.have.property('setTestFile');
      schema.statics.setTestFile.should.be.a('function');
    });

    it('should add the `setTestTag` method to the model', function() {
      var schema = new Schema({ baz: String }).plugin(test_marker);
      schema.statics.should.have.property('setTestTag');
      schema.statics.setTestTag.should.be.a('function');
    });
  });

  describe('Integration tests', function() {
    before(function(done) {
      mongoose.connect('mongodb://localhost:27017/node-marker-test',
                       { server: { poolSize: 2 } },
                       function(err) {
                         Model.setTestFile(__filename);
                         done(err);
                       });
    });

    afterEach(function(done) {
      Model.removeAllTestDocuments(done);
    });

    after(function(done) {
      mongoose.disconnect(done);
    });

    describe('Non tagged documents', function() {
      it('should save the `__test` field', function(done) {
        Model.create({ foo: 'bar', bar: 'baz' }, function(err, doc) {
          should.not.exist(err);

          doc.should.have.deep.property('foo', 'bar');
          doc.should.have.deep.property('bar', 'baz');
          doc.should.have.deep.property('__test');
          doc.should.have.deep.property('__test.filename', __filename);
          doc.should.have.deep.property('__test.pid', String(process.pid));
          doc.should.have.deep.property('__test.hostname', hostname);
          doc.should.have.deep.property('__test.tag', '');

          Model.removeAllTestDocuments(done);
        });
      });

      it('should be possible to save multiple documents', function(done) {
        var nof_documents = 5,
            i = 0,
            docs_to_save = [],
            inserted_ids = [];

        // Create a couple of tagged documents
        for (i = 0; i < nof_documents; i++) {
          docs_to_save.push(internals.createTestDocument());
        }

        Bluebird.all(docs_to_save)
            .then(function(docs) {
              inserted_ids = docs.map(function(doc) {
                return String(doc._id);
              });

              Model.removeAllTestDocuments(function(err) {
                should.not.exist(err);

                Model.find({ _id: { $in: inserted_ids } }, function(err2, documents) {
                  should.not.exist(err2);
                  documents.should.have.length(0);
                  done();
                });
              });
            })
            .catch(done);
      });
    });

    describe('Tagged documents', function() {

      it('should save tagget documents', function(done) {
        Model.setTestTag('foobar');
        Model.create({ foo: 'bar', bar: 'baz' }, function(err, doc) {
          should.not.exist(err);

          doc.should.have.deep.property('foo', 'bar');
          doc.should.have.deep.property('bar', 'baz');
          doc.should.have.deep.property('__test');
          doc.should.have.deep.property('__test.filename', __filename);
          doc.should.have.deep.property('__test.pid', String(process.pid));
          doc.should.have.deep.property('__test.hostname', hostname);
          doc.should.have.deep.property('__test.tag', 'foobar');

          Model.removeAllTestDocuments(done);
        });
      });

      it('should only remove tagged documents', function(done) {
        var nof_tagged_docs = 5,
            nof_untagged_docs = 5,
            tagged_docs = [],
            untagged_docs = [],
            test_tag = 'tag-' + Math.floor(Math.random() * 100000);

        internals.createUntaggedDocuments(nof_untagged_docs)
            .then(function(untagged_ids) {
              untagged_docs = untagged_ids;
              Model.setTestTag(test_tag);
              return internals.createTaggedDocuments(nof_tagged_docs);
            })
            .then(function(tagged_ids) {
              tagged_docs = tagged_ids;
              Model.removeTaggedTestDocuments(test_tag, function(err) {
                should.not.exist(err);

                Model.count({ _id: { $in: untagged_docs } }, function(err2, untagged_count) {
                  should.not.exist(err2);
                  untagged_count.should.eql(nof_untagged_docs);

                  Model.count({ _id: { $in: tagged_docs } }, function(err3, tagged_count) {
                    should.not.exist(err3);
                    tagged_count.should.eql(0);
                    done();
                  });
                });
              });
            })
            .catch(done);
      });
    });
  });
});


internals.createUntaggedDocuments = function(nof_docs) {
  return new Bluebird(function(resolve, reject) {
    var i = 0, docs = [], save_queue = [];

    for (i = 0; i < nof_docs; i++) {
      save_queue.push(internals.createTestDocument());
    }

    Bluebird.all(save_queue)
        .then(function(documents) {
          docs = documents.map(function(doc) {
            return String(doc._id);
          });
          resolve(docs);
        });
  });
};

internals.createTaggedDocuments = function(nof_docs) {
  return new Bluebird(function(resolve, reject) {
    var i = 0, docs = [], save_queue = [];

    for (i = 0; i < nof_docs; i++) {
      save_queue.push(internals.createTestDocument());
    }

    Bluebird.all(save_queue)
        .then(function(documents) {
          docs = documents.map(function(doc) {
            return String(doc._id);
          });
          resolve(docs);
        });
  });
};



internals.createTestDocument = function() {
  return new Bluebird(function(resolve, reject) {
    var obj = {
          foo: 'BAR-' + Math.floor(Math.random() * 100000),
          bar: 'BAZ-' + Math.floor(Math.random() * 100000)
        };
    new Model(obj).save(function(err, doc) {
      if (err) {
        return reject(err);
      }
      resolve(doc);
    });
  });
};
