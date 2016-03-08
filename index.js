'use strict';

const _ = require('lodash');
const crypto = require('crypto');
const request = require('request');
const validator = require('validator');
const scrapingUtils = require('cause-utils/scraping');


// every block needs to exposes a function that takes
// the following parameters:
function main(
		step,		// the current step
		context,	// TODO: explain
		config,		// TODO: explain
		input,		// the previous step's output is this step's input
		done		// callback function(err, output, decision)
		) {
	// when a step is created,
	// `config` and `step.data` are populated with
	// values from the task config file, or with the defaults
	// the step defines itself. → see end of file.

	// validation
	if (!validator.isURL(config.url)) {
		throw new Error(`not a valid url: ${config.url}`);
	}

	const reqOpts = {
		url: config.url
	};
	request(reqOpts, (err, res, body) => {
		if (err) { return done(err); }

		if (res.statusCode !== 200) {
			const message = `status code: ${res.statusCode}\n${JSON.stringify(config)}`;
			context.debug(message);
			return done(new Error(message));
		}

		// select part of page
		const $selection = scrapingUtils.query(config.method, config.selector, body);
		if ($selection.length > 1) {
			context.logger.warn('selection contains more than one element — only using first one.');
		}
		const html = $selection.first().html();

		if ($selection.length === 0) {
			const message = `empty selection\n${JSON.stringify(config)}`;
			const err = new Error(message);
			context.debug(message);
			return done(err);
		}

		// create a hash for it
		const hash = crypto
			.createHash('md5')
			.update(html)
			.digest('hex');

		// this block simply passes through its input
		const output = input;

		// check if anything has changed
		const changed = (hash !== step.data.prevHash);

		// save current hash to file
		step.data.prevHash = hash;
		context.saveTask();

		// callback
		done(null, output, changed);
	}).on('error', (err) => {
		// make sure to catch those errors
		// https://github.com/request/request/issues/636#issuecomment-34723546
		done(err);
	});
};


module.exports = {
	main: main,

	defaults: {
		// defaults to as fallbacks, in case they are
		// not specified in the config file
		config: {
			// url: undefined,
			selector: 'body',
			method: 'css'
		},

		// data to be persisted between executions
		data: {
			prevHash: ''
		},

		// underscore template cause describes the step.
		// can access step fields like this: `<%=config.method%>`
		description: 'checks if a (part of a) website has changed'
	}
};
