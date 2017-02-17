# Spotmap
Parkour.org Spotmap
## Introduction
\# TODO

## Getting Started
### Using Node.js
Install this module by typing `npm install` in this root directory.  
The rest is TODO :-(  
\# TODO

### In the Browser
Copy the content of the dist folder on a server and run. It can run without any
 of the frameworks RequireJS, CommonJS and Node.js

In your web page:

```html
<script src="spotmap.min.js"></script>
```
\# TODO


You can also use the file [`dist/index.htm`][html],
 which provides a HTML5 GUI to the Spotmap.

[html]: ./dist/index.htm

### Testing
Lint and test this code using [Grunt](http://gruntjs.com/). If you have the Grunt CLI
 installed globally using `npm install -g grunt-cli` and executed `npm install` previously,
 you can use the following commands:

`grunt test` will run jshint and tests using the files from the lib directory.  
`grunt default` will run jshint, tests, squash the libraries into one file, modify the HTML,
 remove the dependency to requireJS, backport the code to ES5, uglify the result and finally
 run an end-to-end test to ensure compatibility.  
 TODO: Compass CSS, cssmin and LESS/SASS/SCSS support  
 \# TODO


## Perspective
This spotmap is currently in active development. Many features are yet to be improved.
 Updates to this repository will be reflected on our server hosted at
 [www.parkour.org](https://www.parkour.org/).

## Release History
Please refer to the Commit history, as I will probably forget updating this.

## License
Copyright (c) 2017 Björn Eberhardt  
Licensed under the MIT license.