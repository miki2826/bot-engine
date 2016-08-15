'use strict';
const _ = require('lodash');
const async = require('async');
const EventEmitter = require('events').EventEmitter;
const Middleware = require('./Middleware');

let defaultLogger = {
    info: console.info,
    debug: console.log,
    error: console.error
};

/**
 * Bot message flow
 * 1. receive message
 * 2. extract entities (nlp) - middleware
 * 3. extract applicative entities - middleware
 * 4. validate entities - middleware
 * 5. merge context - middleware
 * 6. perform current state action
 * 7. decide next state
 * 8. call to action (based on next state)
 * 9. move to it - wait for input
 */

class Engine extends EventEmitter {

    constructor(options = {
        states: {},
        entities: {}
    }) {
        super();
        this.states = validate(options.states);
        this.entities = options.entities;
        this.log = options.log || defaultLogger;
        this.receiver = new Middleware();
        this.pre = new Middleware();
        this.post = new Middleware();
    }

    /**
     * @param data = {
     *  session, context, entities, message
     * }
     */
    receive(data) {
        let session = data.session;
        if (!session.__engine__) {
            session.__engine__ = {
                state: {
                    weight: -1,
                    enter: [],
                    exit: []
                }
            };
        }
        this.receiver.run(data, (err) => {
            if (!err) {
                this.decide(data);
            } else {
                this.log.debug(`Error received from receive middleware. stopping processing: ${err.message}`);
            }
        });
    }

    /**
     * How to decide on next stage:
     * 1. Find all suitable states (those who match most context elements)
     * 2. filter all states with weight less or equal to current state
     * 3. choose the the one with lowest weight
     */
    decide(data) { //No going backwards in the conversation
        let session = data.session;
        let context = data.context || {};
        let entities = data.entities || {};
        let weight = session.__engine__.state.weight;
        let availableStates = _.filter(this.states, (state) => {
            let missingData = _.without(state.enter, ...Object.keys(context), ...Object.keys(entities));
            return state.weight > weight && (!missingData || !missingData.length);
        });

        availableStates = _.orderBy(availableStates, [state => state.enter.length, 'weight'], ['desc', 'asc']);

        this.log.debug('Next State', availableStates[0]);
        this.validateMove(data, availableStates[0] || session.__engine__.state);//when not found use current state
        //TODO: prevent infinite loop (using count property and emit error)
    }

    validateMove(data, state) {
        //call all relevant validators
        let currentState = data.session.__engine__.state;
        let entitiesToValidate = _.union(currentState.exit, state.enter, Object.keys(data.entities));

        let validators = entitiesToValidate.filter(entityName => this.entities[entityName]).map(entityName => {
            return ((callback) => {
                this.entities[entityName](data, callback);
            });
        });

        async.series(validators, (err) => {
            if (!err) {
                this.preMove(data, state);
            } else {
                this.log.debug(`Error received from validator. stopping processing: ${err.message}`);
            }
        });
    }

    preMove(data, state) {
        this.pre.run(data, (err) => {
            if (!err) {
                this.move(data, state);
            } else {
                this.log.debug(`Error received from pre move middleware. stopping processing: ${err.message}`);
            }
        });
    }

    move(data, state) {
        let session = data.session;
        if (typeof state === "string") {
            state = this.states[state];
        }
        let selectesState = this.states[state && state.name];
        if (selectesState) {
            let from = session.__engine__.state;
            session.__engine__.state = state;
            this.emit('move', session, from, state);

            this.emit(state.name, data, (data) => {
                this.postMove(data);
            });
        }
    }

    postMove(data) {
        this.post.run(data, (err) => {
            if (err) {
                this.log.debug(`Error received from post move middleware. stopping processing: ${err.message}`);
            }
        });
    }
}

function validate(states) {
    _.each(states, (value, key) => {
        value.name = key;
        value.weight = value.weight || 0;
        value.enter = value.enter || [];
        value.exit = value.exit || [];
    });
    return states;
}

module.exports = Engine;
