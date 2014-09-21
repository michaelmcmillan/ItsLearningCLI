var request = require('request');
var cheerio = require('cheerio');
var Table   = require('cli-table');

module.exports = function () {

    /* Settings */
    this.url = 'https://www.itslearning.com/';

    /* Driver */
    this.authenticationDriver;

    /* Request-vars */
    var request    = require('request');
    this.cookieJar = request.jar();

    /* Credentials */
    this.username;
    this.password;

    /* Messages */
    this.messages = [];

    /* Notifications */
    this.notifications = [];

    /**
     * setAuthenticationDriver
     * - Loads an authentication driver for the client
     */
    this.setAuthenticationDriver = function (driver) {
        this.authenticationDriver = driver;
    }

    /**
     * setCredentials
     * - Sets the credentials for the client
     */
    this.setCredentials = function (username, password) {
        this.username = username;
        this.password = password;
    }

    /**
     * authenticate
     * - Attempts to authenticate with the provided driver
     */
    this.authenticate = function (callback) {
        this.authenticationDriver(
            this.username,
            this.password,
            this.cookieJar,
            function () {
                callback();
            }
        );
    }

    /**
     * getUnreadMessages
     * - Returns the messages
     */
    this.getUnreadMessages = function () {
        return this.messages;
    }

    /**
     * getNotifications
     * - Returns the notifications
     */
    this.getNotifications = function () {
        return this.notifications;
    }

    /**
     * fetchUnreadMessages
     * - Fetches unread messages
     */
    this.fetchUnreadMessages = function () {
        var self = this;

        var options = {
            url: this.url + 'Services/NotificationService.asmx' +
                '/GetPersonalMessages',
            jar: this.cookieJar
        }

        request(options, function (error, response, html) {
            $ = cheerio.load(html, {
                normalizeWhitespace: true
            });

            var rawMessages = $('ul').children('li.itsl-message-item-unread');
            rawMessages.each(function (index, rawMessage) {
                var head    = $(rawMessage).children('.itsl-message-item-head');
                var body    = $(rawMessage).children('.itsl-message-item-body');

                var message = {
                    date    : $(head).children('.itsl-widget-extrainfo').text(),
                    from    : $(head).children('a').text(),
                    subject : $(body).children('a').text(),
                    message : $(body).children('span').text()
                }

                self.messages.push(message);
            });
        });
    }

    /**
     * fetchNotifications
     * - Fetches notifications
     */
     this.fetchNotifications = function () {
         var self = this;

         var options = {
             url: this.url + '/Services/NotificationService.asmx'+
                '/GetPersonalNotifications',
             jar: this.cookieJar
         }

         request(options, function (error, response, html) {
             $ = cheerio.load(html, {
                 normalizeWhitespace: true
             });

             var rawNotifications = $('ul').children('li');

             rawNotifications.each(function (index, rawMessage) {
                 var body = $(rawMessage).children('.h-dsp-tc').get(1);
                 var meta = $(body).children('div').children('.itsl-widget-extrainfo');

                 var notification = {
                     date    : $(meta).attr('title'),
                     from    : $(meta).children('a').text(),
                     title   : $(body).children('span').text()
                 }

                 self.notifications.push(notification);
             });
         });
     }

    /**
     * inboxTable
     * - Spits out a formatted table of the inbox
     */
     this.inboxTable = function () {
         var table = new Table({
             head: ['Date', 'From', 'Subject'],
             style: {
                 compact: true,
                 'padding-left': 1
             }
         });

         this.getUnreadMessages().forEach(function (message) {
             table.push([message.date, message.from, message.subject]);
         });

         return table.toString();
     }

     /**
      * notificationTable
      * - Spits out a formatted table of the notifications
      */
      this.notificationTable = function () {
          var table = new Table({
              head: ['Date', 'From', 'Subject'],
              style: {
                  compact: true,
                  'padding-left': 1
              }
          });

          this.getNotifications().forEach(function (notification) {
              table.push([notification.date, notification.from, notification.title]);
          });

          return table.toString();
      }
}
