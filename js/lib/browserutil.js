define(["class", "pubsub"], function(Class, Pubsub) {
  var BrowserUtil = Class.extend({
    init: function() {
      var blur = function onBlur() {
        document.body.className = 'blurred';
        Pubsub.publish("window:blurred")
      };

      var gain = function onFocus(){
        document.body.className = 'focused';
        Pubsub.publish("window:focused")
      };

      if (BrowserUtil.isIE()) {
        document.onfocusin = gain;
        document.onfocusout = blur;
      } else {
        window.onfocus = gain;
        window.onblur = blur;
      }

      window.onresize = function(e) {
        if (window._resize) {
          clearTimeout(window._resize);
        }

        Pubsub.publish("window:resizing");

        window._resize = setTimeout(function() {
          delete window._resize;
          Pubsub.publish("window:resized", e);
        }, 100);
      };
    }
  });

  BrowserUtil.isIE = function() {
    if (window._isIE === undefined) {
      var div = document.createElement('div');
      div.innerHTML = '<!--[if IE]><i></i><![endif]-->';
      window._isIE = (div.getElementsByTagName('i').length === 1);
    }

    return window._isIE;
  };

  return BrowserUtil;
});