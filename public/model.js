// Implements key-value models with a functional reactive `when` operator.
// See also https://github.com/curran/model
define([], function (){

  // The constructor function, accepting default values.
  return function Model(defaults){

    // The returned public API object.
    var model = {},

        // The internal stored values for tracked properties. { property -> value }
        values = {},

        // The listeners for each tracked property. { property -> [callback] }
        listeners = {},

        // The set of tracked properties. { property -> true }
        trackedProperties = {};

    // The functional reactive "when" operator.
    //
    //  * `properties` An array of property names (can also be a single property string).
    //  * `callback` A callback function that is called:
    //    * with property values as arguments, ordered corresponding to the properties array,
    //    * only if all specified properties have values,
    //    * once for initialization,
    //    * whenever one or more specified properties change,
    //    * on the next tick of the JavaScript event loop after properties change,
    //    * only once as a result of one or more synchronous changes to dependency properties.
    function when(properties, callback){

      // This function will trigger the callback to be invoked.
      var triggerCallback = debounce(function (){
        var args = properties.map(function(property){
          return values[property];
        });
        if(allAreDefined(args)){
          callback.apply(null, args);
        }
      });

      // Handle either an array or a single string.
      properties = (properties instanceof Array) ? properties : [properties];

      // Trigger the callback once for initialization.
      triggerCallback();
      
      // Trigger the callback whenever specified properties change.
      properties.forEach(function(property){
        on(property, triggerCallback);
      });
    }

    // Returns a debounced version of the given function.
    // See http://underscorejs.org/#debounce
    function debounce(callback){
      var queued = false;
      return function () {
        if(!queued){
          queued = true;
          setTimeout(function () {
            queued = false;
            callback();
          }, 0);
        }
      };
    }

    // Returns true if all elements of the given array are defined, false otherwise.
    function allAreDefined(arr){
      return !arr.some(function (d) {
        return typeof d === 'undefined' || d === null;
      });
    }

    // Adds a change listener for a given property with Backbone-like behavior.
    // See http://backbonejs.org/#Events-on
    function on(property, callback){
      getListeners(property).push(callback);
      track(property);
    };

    // Gets or creates the array of listener functions for a given property.
    function getListeners(property){
      return listeners[property] || (listeners[property] = []);
    }

    // Tracks a property if it is not already tracked.
    function track(property){
      if(!(property in trackedProperties)){
        trackedProperties[property] = true;
        values[property] = model[property];
        Object.defineProperty(model, property, {
          get: function () { return values[property]; },
          set: function(value) {
            values[property] = value;
            getListeners(property).forEach(function(callback){
              callback(value);
            });
          }
        });
      }
    }

    // Sets all of the given values on the model.
    // Values is an object { property -> value }.
    function set(values){
      for(property in values){
        model[property] = values[property];
      }
    }

    // Transfer defaults passed into the constructor to the model.
    set(defaults);

    // Expose the public API.
    model.when = when;
    model.on = on;
    model.set = set
    return model;
  }
});
