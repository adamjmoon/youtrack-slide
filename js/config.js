require.config({
  baseUrl: "./js",
  paths: {
    jquery        : "lib/jquery-1.7.2",
    underscore    : "lib/underscore-amdjs-1.3.2",
    backbone      : "lib/backbone-amdjs-0.9.2",
    bootstrap     : "lib/bootstrap/js/bootstrap",
    class         : "lib/class",
    pubsub        : "lib/pubsub"
  },

//  priority: [ "jquery", "underscore", "backbone" ],
  urlArgs: "v=1.0"
});

require(["jquery", "app", "lib/browserutil"], function ($, App, BrowserUtil) {
  $(function() {

    // initialize some generic browser listeners
    window.browser_util = new BrowserUtil();

    window.app = new App("http://youtrack.jetbrains.com");
  });
});