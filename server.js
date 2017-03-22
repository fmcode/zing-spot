"use strict";

const chalk = require('chalk');
const express = require('express');
const http = require('http');
const nconf = require('nconf');
const passport = require('passport'),
	BasicStrategy = require('passport-http').BasicStrategy;
const randomstring = require('randomstring');

const package_json = require('./package.json');
const utils = require('./utils');

let _username = null;
let _password = null;

passport.use(new BasicStrategy(
	function (username, password, done) {
		if (!_username || username !== _username || !_password || _password != password) {
			return done(null, false);
		}

		return done(null, {
			username: _username
		});
	}
));

module.exports = function (port, username, password, scanner) {
	_username = username || 'admin';
	_password = password || randomstring.generate(8);

	let spinner = utils.ora('starting server ...');
	let app = express();

	app.use('/', passport.authenticate('basic', {
			session: false
		}),
		express.static('public_html'));

	app.get('/api/info', function (req, res) {
		res.json({
			mac: scanner.myAddr,
			version: package_json.version
		});
	});

	app.get('/api/discover', function (req, res) {
		let ret = [];
		scanner.mqCache.forEach(function (value, key) {
			ret.push(value);
		});
		res.json(ret);
	});

	let ip = utils.myIP();
	let server = http.createServer(app).listen(port);

	spinner.finish('server', 'UP');

	console.log();
	utils.log('HTTP', 'Listening on http://' + chalk.bold(ip + ':' + server.address().port));
	utils.log('HTTP', '    username: \'' + chalk.bold(_username) + '\'');
	utils.log('HTTP', '    password: \'' + chalk.bold(_password) + '\'');
};