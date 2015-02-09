'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var test_marker = require('../index.js');

var schema = new Schema({
      foo: String,
      bar: String
    }).plugin(test_marker);

module.exports = mongoose.model('test', schema);
