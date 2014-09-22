#!/usr/bin/env node
var fs          = require('fs');
var config      = require('./config.js');
var cli         = require('cli');
var prompt      = require('prompt');
var ntnu        = require('./drivers/ntnu.js');
var itslearning = require('./itslearning.js');


cli.setApp('its', '0.0.1');

cli.parse({
    setup        : ['s', 'Setup credentials and driver.'],
    notifications: ['n', 'List notifications.'],
    inbox        : ['i', 'List messages in your inbox.'],
    courses      : ['c', 'List all courses with their corresponding id.'],
    bulletins    : ['b', 'List bulletings (news) for a single course id.', 'number'],
    tree         : ['t', 'List directories and files for a single course.', 'number']
});

var setup = function () {
    var configuration = new config();

    var setupSchema = {
        properties: {
            username: {
                description: 'It\'sLearning username',
                required: true
            },

            password: {
                description: 'It\'sLearning password',
                hidden: true
            },

            driver: {
                description: 'Authentication driver',
                required: true,
                conform: function (file) {
                    return fs.existsSync(__dirname + '/drivers/'+ file +'.js');
                }
            },
        }
    };

    prompt.start();
    prompt.get(setupSchema, function (err, answers) {
        if (!err) {
            configuration.set(answers);
            configuration.save();
            cli.ok('Configuration stored.');
        }
    });
}


cli.main(function (args, options) {

    /**
     * Run setup
     */
     var configuration = new config;
     if (options.setup || !configuration.exists) {
         setup();
     } else {

        /**
         * Load the configuration
         */
         configuration.load();

        /**
         * Initiate the itslearning-client
         */
         var client = new itslearning();
         client.setCredentials(
             configuration.getField('username'),
             configuration.getField('password')
         );

        /**
         * Initiate the authentication driver
         */
         client.setAuthenticationDriver(
             require('./drivers/'+ configuration.getField('driver') +'.js')
         );

        /**
         * Authenticate with the client & fetch data
         */
         client.authenticate(function () {

             /**
              * List messages in inbox
              */
              if (options.inbox) {
                  client.fetchUnreadMessages(function () {
                      console.log(client.inboxTable());
                  });
              }

             /**
              * List notifications
              */
              if (options.notifications) {

                  client.fetchNotifications(function () {
                      console.log(client.notificationTable());
                  });

              }

             /**
              * List courses
              */
              if (options.courses) {
                  client.fetchCourses(function () {
                      console.log(client.courseTable());
                  });
              }

             /**
              * List bulletings for a course
              */
              if (options.bulletins) {

                    console.log("Not yet implemented.");
              }

             /**
              * List folders and files (tree) for a course
              */
              if (options.tree) {
                  setTimeout(function () {
                      client.fetchTree(options.tree);
                  }, 4500);
              }





             if (options.bulletins) {
                client.fetchBulletins(options.bulletins);
             }
         });


    }
});
