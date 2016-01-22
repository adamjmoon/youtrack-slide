define(["class"], function(Class) {
  var Keys = Class.extend({
    keyCodes: {8:'BACKSPACE', 9:'TAB', 13:'ENTER', 16:'SHIFT', 17:'CONTROL', 18:'ALT', 27:'ESCAPE',
      33:'PG_UP', 34:'PG_DN', 35:'END', 36:'HOME', 37:'LEFT', 38:'UP', 39:'RIGHT', 40:'DOWN',
      46:'DELETE', 91:'META', 191: '/', 0:'UNKNOWN'},
    repeatKeys:[ 37, 38, 39, 40 ],

    init: function() {
      var self = this;
      $(document).on("keydown", function(e) {
        self._keydown(e);
      });

      this.shortcuts = {};
    },

    shortcut: function(stroke, handler, context) {
      this.shortcuts[stroke] = [handler, context];
    },

    _keydown: function(e) {
      if (e.target.tagName == "INPUT") return true;

      var handler = this.shortcuts[this._stroke(e)];
      if (handler == undefined) return true;

      var ctx = handler[1] == undefined ? this : handler[1];

      var result = handler[0].call(ctx);
      if (result || result == undefined) {
        e.preventDefault();
        return false;
      }

      return true;
    },

    _swap: function (e, v) {
      return $.inArray(e.keyCode, this.repeatKeys) != -1 &&
          e.type == v ? (v == "keydown" ? "pressed" : "typed") : (v == "keydown" ? "typed" : "pressed");
    },

    _stroke:function (e) {
      var stroke = this._modifier(e);

      var mouse_event = e.type == "click";
      switch (e.type) {
        case "keydown":
          stroke += this._swap(e, "keydown");
          break;
        case "keyup":
          stroke += "released";
          break;
        case "keypress":
          stroke += this._swap(e, "keypress");
          break;
        case "click":
          stroke += "clicked";
          break;
        default:
          stroke += e.type;
          break;
      }

      if (mouse_event) {
        stroke += " LEFT"; // other buttons?
      } else {
        var keycode = this.keyCodes[e.keyCode];
        if (keycode === undefined) keycode = String.fromCharCode(e.keyCode);
        stroke += " " + ($.inArray(e.charCode, [0, 13]) != -1 || e.charCode === undefined ? keycode : String.fromCharCode(e.charCode));
      }

//      console.debug(stroke + " ( " + e.charCode + " / " + e.keyCode + " )");

      return stroke;
    },

    _modifier:function (e) {
      if (e.shiftKey && e.charCode != 0 && !e.altKey && !e.ctrlKey) return "";
      var S = "";
      if (e.altKey) S += "ALT ";
      if (e.shiftKey) S += "SHIFT ";
      if (e.ctrlKey) S += "CONTROL ";
      else if (e.metaKey) S += "META "; // meta is triggered with control on macs too!

      return S;
    }
  });

  return Keys;
});