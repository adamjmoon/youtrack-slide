define(["class"], function(Class) {
  var Util = Class.extend({});

  Util.DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  Util.daysPassed = function(timestamp) {
    return Math.round((+new Date - parseInt(timestamp)) / (60000 * 60 * 24));
  };

  Util.valFromArray = function(array, name) {
    for (var i in array) {
      if (array[i].name === name) {
        return array[i].value;
      }
    }
  };

  return Util;
});