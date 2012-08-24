## Overview

This app is written entirely in Javascript. It uses [JetBrains YouTrack](http://www.jetbrains.com/youtrack/) REST API
and [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) technology to enable cross-domain communication.

## Configuration

In order to be able to use CORS with YouTrack you have to enable it:

1. Go to an Administration page of your YouTrack installation
2. In "Settings" screen enable "REST API" for "All origins" or for selected hosts (separated by new lines).

Then fix your YouTrack installation url in _config.js_:

  window.app = new App("http://YOUTRACK_URL");

## Environment

Tested under [Google Chrome](http://google.com/chrome) only. Should work under [Safari](http://apple.com/safari) and
[Firefox](http://getfirefox.com) browsers as well.

## Known issues

1. Only first 100 items are loaded