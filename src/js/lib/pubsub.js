// simple observer (pubsub) implementation
define(["underscore", "class"], function(_, Class) {
  var PubSub = Class.extend({});

  PubSub._topics = function() {
    if (!window.pubsub) {
      window.pubsub = {};
    }

    return window.pubsub;
  };

  PubSub.subscribe = function (topic, callback) {
    var topics = PubSub._topics();
    if (!topics[topic]) {
      topics[topic] = [];
    }

    var pair = [callback];
    if (arguments.length == 3) {
      // context?
      pair.push(arguments[2]);
    }

    topics[topic].push(pair);
    return [topic, callback];
  };

  PubSub.unsubscribe = function (handle) {
    var topic = handle[0];
    var topics = PubSub._topics();
    topics[topic] && _.each(topics[topic], function (l, i) {
      if (l[0] === handle[1]) {
        topics[topic].splice(i, 1);
      }
    });
  };

  PubSub.publish = function (topic) {
    var args = _.map(arguments,function (arg) { return arg; });
    args.shift();
    var topics = PubSub._topics();
    _.each(topics[topic], function (l) {
      l[0].apply(l.length == 2 ? l[1] : PubSub, args);
    });
  };

  return PubSub;
});