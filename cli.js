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
    dashboard    : ['d', 'Spit out a summary of everything'],
    courses      : ['c', 'List all courses with their corresponding id.'],
    bulletins    : ['b', 'List bulletings (news) for a single course id.', 'number']
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
         //cli.spinner('Working..');
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
             client.fetchUnreadMessages();
             client.fetchNotifications();
             client.fetchCourses();

             if (options.bulletins) {
                 client.fetchBulletins(options.bulletins);
             }
         });

         /**
          * List messages in inbox
          */
          if (options.inbox) {

              setTimeout(function () {
                  console.log(client.inboxTable());
              }, 4500);

          }

         /**
          * List notifications
          */
          if (options.notifications) {

              setTimeout(function () {
                  console.log(client.notificationTable());
              }, 4500);

          }

         /**
          * List courses
          */
          if (options.courses) {
              setTimeout(function () {
                  console.log(client.courseTable());
              }, 4500);
          }

         /**
          * List bulletings for a course
          */
          if (options.bulletins) {

              setTimeout(function () {
                  console.log(client.bulletinsTable(options.bulletins));
              }, 4500);
          }
    }
});
