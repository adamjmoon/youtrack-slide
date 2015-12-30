define(["underscore", "backbone"], function(_, Backbone) {
  var Router = Backbone.Router.extend({
    routes: {
      "search/:query": "_onSearch"
    },

    initialize: function(cb, context) {
      this.callback = cb;
      this.context = context;

      Backbone.history.start();
    },

    _onSearch: function(query) {
      this.callback.call(this.context, query);
    }
  });

  return Router;
});