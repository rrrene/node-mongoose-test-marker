
[![Coverage Status](https://coveralls.io/repos/Springworks/node-mongoose-test-marker/badge.png)](https://coveralls.io/r/Springworks/node-mongoose-test-marker)
[![Build Status](https://travis-ci.org/Springworks/node-mongoose-test-marker.svg?branch=master)](https://travis-ci.org/Springworks/node-mongoose-test-marker)
[![Dependency Status](https://david-dm.org/springworks/node-mongoose-test-marker.svg)](https://david-dm.org/springworks/node-mongoose-test-marker)

## 1.0.x API Reference
* [Introduction](#introduction "Introduction")
* [API](#api "API")
  * [Example usage](#example-usage "Example Usage")
  * [`Model.setTestFile(filename)`](#modelsettestfilefilename "Model.setTestFile(filename)")
  * [`Model.setTestTag(tagname)`](#modelsettesttagtagname "Model.setTestTag(tagname)")
  * [`Model.removeAllTestDocuments(callback)`](#modelremovealltestdocumentscallback "Model.removeAllTestDocuments(callback)")
  * [`Model.removeTaggedTestDocuments(tagname, callback)`](#modelremovetaggedtestdocumentstagname-callback "Model.removeTaggedTestDocuments(tagname, callback)")
* [Running Tests](#running-tests "Running Tests")
* [License](#license "License")

## Introduction
This module will help you keep track of documents created during tests in your project. It will
also add some metadata to the document, so it can be tracked if anything goes wrong.

Metadata added:

```javascript
  __test: {
    pid: String,
    hostname: String,
    filename: String,
    tag: String
  }
```

## Api
All the publicly accessible methods on the module api.

### Example usage

```javascript
'use strict';

var test_marker = require('mongoose-test-marker'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    schema = new Schema({ foo: String }).plugin(test_marker),
    Model = mongoose.model('test', schema);

describe('This is my test', function() {

  before(function() {
    Model.setTestFile(__filename);
  });
  after(function(done) {
    // Removes all documents for this file and model. (including tagged documents).
    Model.removeAllTestDocuments(done);
  });

  describe('Sub tests', function() {
    var sub_tag = 'ThisIsMyTag';

    before(function() {
      Model.setTestTag(sub_tag);
    });
    after(function(done) {
      // Removes all tagged documents, scoped to this file.
      Model.removeTaggedTestDocuments(sub_tag);
    });
  });
});

```


### `Model.setTestFile(filename)`
Sets the currently tracked file. This function has to be called for the plugin to collect
documents inserted to a model. The plugin will throw an error if the filename is not set.

```javascript
'use strict';

var test_marker = require('mongoose-test-marker'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    schema = new Schema({ foo: String }).plugin(test_marker),
    Model = mongoose.model('test', schema);

describe('This is my test', function() {

  before(function() {
    Model.setTestFile(__filename);
    // All documents created by this model is now scope to this filename.
  });

});
```


### `Model.setTestTag(tagname)`
Sets a tag. This will branch of all documents created between the `setTestTag` and
`removeTaggedTestDocuments` calls. This is useful for isolated sub tests.

```javascript
'use strict';

var test_marker = require('mongoose-test-marker'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    schema = new Schema({ foo: String }).plugin(test_marker),
    Model = mongoose.model('test', schema);

describe('This is my test', function() {

  before(function() {
    Model.setTestFile(__filename);
    // All documents created by this model is now scope to this filename.
  });

  describe('Sub tests', function() {
    var sub_tag = 'ThisIsMyTag';

    before(function() {
      // Documents will now be created with a tag, which isolates documents.
      Model.setTestTag(sub_tag);
    });
    after(function(done) {
      // Removes all tagged documents for this model, scoped to this file.
      // Will not remove documents created before the `setTestTag` call.
      Model.removeTaggedTestDocuments(sub_tag);
    });
  });
});
```

### `Model.removeAllTestDocuments(callback)`
Removes all test documents for the current file and model.

```javascript
'use strict';

var test_marker = require('mongoose-test-marker'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    schema = new Schema({ foo: String }).plugin(test_marker),
    Model = mongoose.model('test', schema);

describe('This is my test', function() {

  before(function() {
    Model.setTestFile(__filename);
    // All documents created by this model is now scope to this filename.
  });

  after(function(done) {
    // Removes all documents for this file and model. This includes all tagged documents
    // for this file an model.
    Model.removeAllTestDocuments(done);
  });

});
```

### `Model.removeTaggedTestDocuments(tagname, callback)`
Removes only the tagged documents for the current file and model.

```javascript
'use strict';

var test_marker = require('mongoose-test-marker'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    schema = new Schema({ foo: String }).plugin(test_marker),
    Model = mongoose.model('test', schema);

describe('This is my test', function() {

  before(function() {
    Model.setTestFile(__filename);
  });
  after(function(done) {
    // Removes all documents for this file and model. (including tagged documents).
    Model.removeAllTestDocuments(done);
  });

  describe('Sub tests', function() {
    var sub_tag = 'ThisIsMyTag';

    before(function() {
      Model.setTestTag(sub_tag);
    });
    after(function(done) {
      // Removes all tagged documents, scoped to this file.
      Model.removeTaggedTestDocuments(sub_tag);
    });
  });
});
```

## Running Tests

```bash
$ npm test
```


## License
MIT
