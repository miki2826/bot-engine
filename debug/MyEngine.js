'use strict';
const Engine = require('./../lib/Engine');

const states = { //Searching for lowest matching priority
    uninitialized: { //No priority same as 0
    },
    greetNew: {
        priority: 20
    },
    greetExisting: {
        priority: 20,
        expecting: ['returning']
    },
    promptToContinue: {
        priority: 21,
        expecting: ['returning']
    },
    handleContinueQuestion: {
        priority: 30,
        expecting: ['returning', 'yes_no']
    },
    handleAge: {
        priority: 40,
        expecting: ['age']
    },
    handleLocation: {
        priority: 50,
        expecting: ['location']
    },
    handleService: {
        priority: 60,
        expecting: ['service']
    },
    recommend: {
        priority: 70,
        expecting: ['service', 'location', 'age']
    }
};

let engine = new Engine({
    states: states,
    entities: {
        service: () => {
            //some validation function
        }
    }
});

engine.use();
module.exports = engine;
