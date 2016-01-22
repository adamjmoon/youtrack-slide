define(["underscore", "backbone"], function(_, Backbone) {
  var Selection = Backbone.Model.extend({

    initialize: function() {
      _.bindAll(this);
    },

    select: function(id) {
      var old = this.selection();
      if (old !== id) {
        this.set({id: id});
        this.trigger("selection", id, old);
      }
    },

    selection: function() {
      return this.get("id");
    },

    clear: function() {
      this.select();
    }
  });

  return Selection;
});