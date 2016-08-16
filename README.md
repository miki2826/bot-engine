bot-engine 
-----------
> Generic conversation engine

<!--- TODO: add description - what the problem is and how this solves it -->
##Installation
`npm i bot-engine --save`

##Configuration example
```javascript
let options = {
    maxVisits: 3, //To prevent infinite loop when visiting in the same state multiple times - default 10
    states: {
        
    },
    entities: {
        
    },
    logger //defaults to console
}
```

##Concept

### Weights and rules
State decision is based on weights where the engine will always choose to go forward (unless explicitly choosing a state).
In order to move to a state, all `enter` rules of said state and all `exit` rules of current state must be satisfied.
Satisfying a rule is running an entity validator (if exists) and passing without an error.

### Entities
Entities are being validated base on existence in `entities` object, `enter` rules of selected state and `exit` of current state.
Validators are async and beeing called with a `callback`.
Calling callback with an `error` object will cancel current message lifecycle. 

### Middleware
The engine allows multiple middleware stages to integrate: `receive`, `pre move`, `post move`.
Each middleware is async and being passed `data` - which was passed on receive, and `callback`.
Calling callback with an `error` object will cancel current message lifecycle.

###Message Lifecycle
```
receive --> receiver middleware --> decide --> 
    validateMove --> pre move middleware --> 
        move ---> emit state name --> post move middleware
```

##API

###receive(data)
Representing a received message
Where data expected to be:
```javascript
let data = {
    session, //Object representing the current user - Will keep a __engine__ object representing current state
    context, //context holding all entities so far (flat)
    entities, //current message extracted entities
    message, //optional - will help midllware to extract data
    //can pass anything else - will pass as is to middlewares
}
```

