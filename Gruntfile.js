'use strict';

module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed MIT */\n',
    footer: '',
    // Task configuration.
	concat: {
      options: {
        // Remove RequireJS and CommonJS features for the dist version, to make the result runnable standalone in a browser.
        banner: "'use strict';\n<%= banner %>\n",
        footer: '<%= footer %>',
        stripBanners: {all: true},
        process: function(src, filepath) {
          const classname = /^(?:.*\/)(.*?)(?:\.js)$/.exec(filepath)[1].replace(/[.-]/, '_');
          const isGlobal = src.includes('// global');
          return '// Source: ' + filepath + '\n' +
            src.replace(/^[ \t]*\/\*[\s\S]*?\*\/\s*/, '')
               .replace(/(^|\n)[ \t]*(\(\s*function\s*\(\s*exports\s*\)\s*\{\s*)/g, isGlobal ? `(function ($) {\n` : `const ${classname} = {}; (function (exports) {\n`)
               .replace(/(^|\n)[ \t]*((let|var|const|\/\/) .*)?require\(.*\);?/g, '')
               .replace(/(^|\n)[ \t]*const .* = window/g, '')
               .replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*\n/g, '$1')
               .replace(/\(\s*typeof\s+exports[^)]*this\)\s*\)\s*;\s*/g, isGlobal ? `(window));` : `(${classname})); if (typeof exports !== 'undefined') exports.${classname} = ${classname};`);
        }
      },
      dist: {
        src: ['src/scripts/*.js', '!src/scripts/lang*.js', '!src/scripts/tictactoe.js', '!src/scripts/testing.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    copy: {
      main: {
        files: [
          // includes files within path
          {expand: true, cwd: 'src/', src: ['*.php', 'manifest.json', '.htaccess', '*.css', '*.js'], dest: 'dist/', filter: 'isFile'},
          // includes files within path and its sub-directories
          {expand: true, cwd: 'src/', src: ['flags/*', 'static/*', 'images/*', 'scripts/lang*.js', 'scripts/tictactoe.js', 'scripts/testing.js'], dest: 'dist/'}
        ]
      },
      html: {
        files: [
          {expand: true, cwd: 'src/', src: ['index*.htm'], dest: 'dist/', filter: 'isFile'}
        ],
        options: {
          process: function(src) {
            return src
                .replace(/<!-- development[\s\S]*\/development -->\s+/g, '')
                .replace(/<!-- production\s+/g, '')
                .replace(/\/production -->\s+/g, '');
          }
        }
      },
      babel: {
        files: [
            {expand: true, cwd: 'node_modules/babel-polyfill/dist/', src: ['polyfill.min.js'], dest: 'dist/scripts/', filter: 'isFile'}
        ]
      }
    },
    babel: {
      options: {
        presets: ['env']
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.es5.js': '<%= concat.dist.dest %>'
        }
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: 'dist/<%= pkg.name %>.es5.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*_test.js']
      },
      dist: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*_e2e.js']
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        options: {
          jshintrc: 'src/scripts/.jshintrc'
        },
        src: ['src/scripts/**/*.js']
      },
      test: {
        src: ['test/**/*.js']
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'mochaTest:test']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'mochaTest:test']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');

  // Default task.
  grunt.registerTask('default', ['jshint', 'mochaTest:test', 'copy', 'concat', 'babel', 'uglify', 'mochaTest:dist']);
  grunt.registerTask('test', ['jshint', 'mochaTest']);

};
