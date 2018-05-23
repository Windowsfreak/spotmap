# Spotmap
This Github project provides a scrollable map
powered by Google Maps, that displays spots like
Points of Interest as pinpoints, and when you
click on them, you can see more details.

Our spotmap database contains more than 6,000
spots, but it could as well contain 50,000 spots.
Each spot has a geographical location (longitude,
latitude), a name (title), some description, and
it could have one or more photos attached.

This project also provides a means of clustering
spots to save bandwidth and memory usage for
geospatial filtering.

This Github project contains the sources for the
Parkour.org Spotmap. The intention of the spotmap
## Introduction
In the Parkour world, people like to travel,
meet up and share interesting places to do training
together. We want to support the Parkour community
by providing an easy way to find and discover
interesting places when you travel and in your
neighbourhood.

Our intention is not to keep people attached to
a website or show advertisement, generate revenue
or achieve a level of commercialization. Ideally,
people use this as a tool, like Wikipedia or online
translators, and then get out to train together.

The spots are mostly user-generated and often
clustered around big cities. Our previous spotmap
hat problems with handling the vast amount of
spots that were added over time, and network
bandwidth, memory usage and loading time was
important to make this experience enjoyable,
so an optimization was necessary.

This project combines a front-end with an optimized
backend to improve the performance of the spotmap.
Further optimizations are still possible, like
server-side or client-side caching of requests,
offline-first features or preloading important files,
static responses and alike. But we can come back to
this once we hit more than 50k hits per hour.
### Current limitations
This current version only displays the most
important information about spots. The following
fields - may they exist - are **not** displayed in the
current release of the Spotmap:

- Edit history
- Postal Address
- Telephone numbers
- Workshops that take place on that spot (including
  age, price, time span, recurrence, buying tickets)
### Interactions
Browse - A user can navigate to a part of the map and
retrieve all the spots in sight. If the zoom level is
too small, adjacent spots will be grouped to
magnifying glasses.

Details - If a user clicks on a spot, its name is
shown. Clicking on the name will show a page
containing at least the title, description,
coordinates and a link to Google Maps. Pictures,
categories and other information is shown if available.

Insert - If a user clicks on an empty area, a
draggable crosshair appears. Clicking it again
will give him a choice to create certain types
of spots. An input mask will appear to write
some title and text and save it. After saving
(hence having assigned a primary ID to that spot),
a more sophisticated form will be shown to allow
adding images.

Modify - On the details page, a link is shown (Open
in main website), and on the website, the edit form
could be opened.

Search - A full text search is available from the
map screen using the search button. Our simplified
implementation only looks for substring matches in
the title. The results page displays the spots using
its first photo, its title and an abstract of the
description.

Filter - can show / hide spots of certain categories
on the map. Filters could become more sophisticated
in future.
## Getting Started
TL;DR: Install nodeJS, Grunt, run `npm install` and
type `grunt default`.
### Using Node.js
Install this module by typing `npm install` in this
root directory. If you don't have npm installed,
visit [npmjs.com](https://www.npmjs.com/get-npm).
### In the Browser
Copy the content of the dist folder on a server and
run. It can run without any of the frameworks
RequireJS, CommonJS and Node.js

In your web page:

```html
<script src="spotmap.min.js"></script>
```

You can also use the file [`dist/index.htm`][html],
 which provides a HTML5 GUI to the spotmap project.

[html]: ./dist/index.htm
### Testing and Building
Lint and test this code using
[Grunt](http://gruntjs.com/). If you have the Grunt
CLI installed globally using `npm install -g
grunt-cli` and executed `npm install` previously,
you can use the following commands:

`grunt test` will run jshint and tests using the
files from the lib directory.  

`grunt default` will run jshint, tests, squash the
libraries into one file, modify the HTML, remove
the dependency to requireJS, backport the code
to ES5, uglify the result and finally run an
end-to-end test to ensure compatibility.  

TODO: Compass CSS, cssmin and LESS/SASS/SCSS support  
## Perspective
This spotmap is currently in active development.
Many features are yet to be improved. Updates to
this repository will be reflected on our server
hosted at [map.parkour.org](https://map.parkour.org/).
## Release History
### [0.2.10] - 2018-05-23
Fixed:
- Non-clickable area in map behind vanished filter
### [0.2.9] - 2018-05-20
Added:
- Link to Github project in help text
- Description for Social Media Pages
- Load HTML content into page
- CSS minification
- JS minification now live

Changed:
- Script injection can be controlled and lazy
- Finer control of filters
- Horizontal map mode on spot details page

Removed:
- 'Show on web' button

Fixed:
- Abort Creation from existing spot prevents opening spot again.
- Unexpected scrolling to geolocation
### [0.2.8] - 2018-05-16
Added:
- Link to Github project in help text

Fixed:
- Show new marker on map after creation
### [0.2.7] - 2018-05-16
Added:
- Translation files for IT, NL and DA
- Injectable files in distribution folder for experimental features

Removed:
- Invisible error messages for missing content, etc.
- Unused translations
### [0.2.6] - 2018-05-14
Added:
- GDPR prompt on first load

Changed:
- Better alt text for magnifiers

Removed:
- Unneccessary log messages

Fixed:
- Language not properly detected
- Panning updates Location URL with delays due to issues with Safari on iOS
- Avoid JavaScript errors when Map not loaded
- Cleaner injection of scripts
### [0.2.5] - 2018-05-06
Added:
- Backend code to perform regional pinpoint updates

Changed:
- Better alt text for magnifiers

Removed:
- Legacy backend code for geospatial search

Fixed:
- Add spot was missing the category 'outdoor'
- Map no longer pans to GPS on load after showing spot
### [0.2.4] - 2018-05-06
Added:
- Filter HTML and add Newline in Spot creation
### [0.2.3] - 2018-05-06
Added:
- Invisible Captchas for new spot creation
- Lazy load scripts (e.g. reCAPTCHA) on form load
- Translations for new form fields

Changed:
- Navigates to login on form load when username missing
- Headers sent for new spot creation

Fixed:
- GPS pans map on page load
- Users can now click through GPS circle
- Restore saved spots when username missing
- Translations for spot features

### [0.2.2] - 2018-04-19
Added:
- Clickable images in spot description
- Category choice in editor
- Show more search results

Changed:
- Display spot category and feature
- Submit editor values, now includes username
- Login form text changed, password field removed

Fixed:
- Character encoding in search
### [0.2.1] - 2018-03-24
Added:
- Show more pictures per spot
- Create/modify date and author
### [0.2.0] - 2018-03-10
Changed:
- Changed from Drupal 8 to our own REST backend
Fixed:
- Babel version was deprecated. Moved to Babel 6
### [0.1.0] - 2017-02-21
Changed:
- Integrate spotmap into our existing Drupal 7
  / Drupal 8 website

Please refer to the Commit history for more detailed
development logs.
## License
Copyright (c) 2017-2018 Björn Eberhardt
Licensed under the MIT license.