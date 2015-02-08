'use strict';

var os = require('os'),
    assert = require('assert');
var Triejs = require('triejs');
var internals = {
      messages: {
        NO_TEST_FILENAME: 'You must specify a test filename. Please see `setTestFile(String)`.',
        NO_TAG_NAME: 'You must specify a tag name. Please see `setTestTag(String)`.'
      }
    };
var id_store = new Triejs();

/**
 * Mongoose plugin
 *
 * @param   {Schema}  schema  The mongoose schema to modify.
 */
module.exports = function testMarker(schema) {
  /* istanbul ignore else: Since this is a test util, we don't care about other envs */
  if (process.env.NODE_ENV === 'test') {
    var test_pid = process.pid,
        test_hostname = os.hostname(),
        test_filename = '',
        test_tag = '';

    // Add the `__test` field
    schema.add({
      __test: {
        pid: String,
        hostname: String,
        filename: String,
        tag: String
      }
    });


    /**
     * This hook fires before the document gets saved to the database.
     * What it will do is populate the `__test` sub document with various
     * data about the test.
     *
     * @param {Function} next
     */
    schema.pre('save', function(next) {
      assert.notEqual(test_filename, '', internals.messages.NO_TEST_FILENAME);
      this.__test.pid = test_pid;
      this.__test.hostname = test_hostname;
      this.__test.filename = test_filename;
      this.__test.tag = test_tag;
      next();
    });


    /**
     * This hook fires when the document has been inserted into the database.
     * It will store the inserted id in our internal `trie` data structure for
     * easy lookup when we want to clean up our documents.
     */
    schema.post('save', function(doc) {
      var identifier = test_filename;
      if (test_tag !== '') {
        identifier = identifier + '!' + test_tag;
      }
      id_store.add(identifier, String(doc._id));
    });


    /**
     * Filename of the file containing the tests.
     *
     * @param  {String}  filename
     */
    schema.statics.setTestFile = function(filename) {
      assert.notEqual(filename, '', internals.messages.NO_TEST_FILENAME);
      test_filename = filename;
    };


    /**
     * Branches of the test marking with a tag.
     *
     * @param  {String}  tagname
     */
    schema.statics.setTestTag = function(tagname) {
      assert.notEqual(tagname, '', internals.messages.NO_TAG_NAME);
      test_tag = tagname;
    };


    /**
     * Removes all documents for a given `tag`. Once the documents have been removed
     * it will reset the current `tag` for the plugin, reverting back to non tagged
     * documents. (Based on the `test_filename`).
     *
     * @param   {String}    tagname
     * @param   {Function}  callback
     */
    schema.statics.removeTaggedTestDocuments = function(tagname, callback) {
      assert.notEqual(tagname, '', internals.messages.NO_TAG_NAME);

      var store_identifier = test_filename + '!' + tagname,
          ids_to_remove = id_store.find(store_identifier),
          query = { _id: { $in: ids_to_remove } };

      this.remove(query, function(err, num) {
        if (err || num !== ids_to_remove.length) {
          return callback(err);
        }
        id_store.remove(store_identifier);
        test_tag = '';
        callback();
      });
    };

    // Add the `removeTestDocuments` method
    schema.statics.removeAllTestDocuments = function(callback) {
      var ids_to_remove = id_store.find(test_filename),
          query = { _id: { $in: ids_to_remove } };

      this.remove(query, function(err, num) {
        /* istanbul ignore next: safety harness */
        if (err || num !== ids_to_remove.length) {
          return callback(err);
        }
        id_store.remove(test_filename);
        test_tag = '';
        callback();
      });
    };
  }
};


/* istanbul ignore else */
if (process.env.NODE_ENV === 'test') {
  /** @protected */
  module.exports.internals = internals;
}
