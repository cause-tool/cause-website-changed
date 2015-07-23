var _ = require('lodash');
var crypto = require('crypto');
var request = require('request');
var validator = require('validator');


// every block needs to exposes a function that takes
// the following parameters:
function fn(
		task,		// the task this step is part of
		step,		// the current step
		input,		// the previous step's output is this step's input
		prev_step,	// the previous step
		done		// callback function(err, output, decision)
	) {

	// additionally, `this` exposes the following fields / functions:
	var cause = this;
	// - `cause.save()`: save current task: after `step.data` has changed
	// - `cause.debug(message)`: log debug message, using [debug](https://www.npmjs.com/package/debug)
	// - `cause.handle_error(err)`
	// - `cause.message_vars`:
	// [...]

	// when a step is created,
	// `step.options` and `step.data` are populated with
	// values from the task config file, or with the defaults
	// the step defines itself. → see end of file.

	// validation
	if (!validator.isURL(step.options.url)) {
		throw new Error('not a valid url: ' + step.options.url);
	}

	var req_options = {
		url: step.options.url
	};
	request(req_options, function(err, res, body) {
		if (err) { return done(err); }

		if (res.statusCode != 200) {
			var message = 'status code: '+res.statusCode+'\n'+JSON.stringify(step.options);
			cause.debug(message);
			return done(new Error(message));
		}

		// select part of page
		var $selection = cause.utils.scraping.query(step.options.method, step.options.selector, body);
		if ($selection.length > 1) {
			cause.winston.warn('selection contains more than one element — only using first one.');
		}
		var html = $selection.first().html();

		if ($selection.length === 0) {
			var message = 'empty selection\n'+JSON.stringify(step.options);
			var err = new Error(message);
			cause.debug(message);
			return done(err);
		}

		// create a hash for it
		var hash = crypto
			.createHash('md5')
			.update(html)
			.digest('hex');

		// this block simply passes through its input
		var output = input;

		// check if anything has changed
		var changed = (hash != step.data.prev_hash);

		// save current hash to file
		step.data.prev_hash = hash;
		cause.save();

		// callback
		done(null, output, changed);
	}).on('error', function(err) {
		// make sure to catch those errors
		// https://github.com/request/request/issues/636#issuecomment-34723546
		cause.handle_error(err);
	});
};


module.exports = {
	fn: fn,

	defaults: {
		// defaults to as fallbacks, in case they are 
		// not specified in the config file
		options: {
			selector: 'body',
			method: 'css'
		},

		// data to be persisted between executions
		data: {
			prev_hash: ''
		},

		// underscore template cause describes the step.
		// can access step fields like this: `<%=options.method%>`
		description: "website changed"
	}
};
