'use strict';


/** let entities = {
     *      age: {
     *          value: 7,
     *          error: 'Too Young' //after validity check
     *      }
     *  };
 **/
function mergeContext(entities = {}, context = {}) { //After validate
    for (let entityName in entities) {
        if (entities.hasOwnProperty(entityName) &&
            typeof entities[entityName].value !== 'undefined' && !entities[entityName].error) {
            context[entityName] = entities[entityName].value;
        }
    }
    return context;
}

module.exports = {};
