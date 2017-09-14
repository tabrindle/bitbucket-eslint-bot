#!/usr/bin/env node

var bot = require('./index.js');
var argv = require('minimist')(process.argv.slice(2));

bot.run(argv);
