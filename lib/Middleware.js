'use strict';
const EventEmitter = require('events').EventEmitter;
const async = require('async');

class Middleware extends EventEmitter {

    constructor() {
        super();
        this.handlers = [];
    }

    use(fn) {
        if (typeof fn === 'function') {
            this.handlers.push(fn);
        }
    }

    run(data, callback) {
        async.series(this.handlers.map(fn => {
                return ((cb) => fn(data, cb));
            }),
            callback);
    }
}

module.exports = Middleware;
