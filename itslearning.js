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

    /* Courses */
    this.courses = [];

    /* Bulletins */
    this.bulletins = {};

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
    this.authenticate = function (success, fail) {
        this.authenticationDriver(
            this.username,
            this.password,
            this.cookieJar,
            /* Success */
            function () {
                success();
            },
            /* Fail */
            function (error) {
                fail();
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
     * getCourses
     * - Returns the courses
     */
    this.getCourses = function () {
        return this.courses;
    }

    /**
     * getBulletins
     * - Returns the bulletins for a course
     */
    this.getBulletins = function (courseId) {
        return this.bulletins[courseId];
    }

    /**
     * fetchTree
     * - Recursively builds a tree of dirs and files for a course
     */
    this.fetchTree = function (courseId) {
        var self = this;

        var options = {
            url: this.url + 'ContentArea/ContentArea.aspx' +
                '?LocationID='+ courseId +'&LocationType=1',
            jar: this.cookieJar
        }

        /* Find the root-folder-id (hacky) */
        request(options, function (error, response, html) {
            var rootDirId = html.match(/FolderID\=([0-9]+)\'/)[1];

            // This has to be recursively
            // https://www.itslearning.com/Folder/processfolder.aspx?FolderID=

        });
    }

    /**
     * fetchMessages
     * - Fetches all messages
     */
    this.fetchMessages = function (cb) {
        var self = this;

        var options = {
            url: this.url + 'Messages/InternalMessages.aspx' +
                '?MessageFolderId=1',
            jar: this.cookieJar
        }

        request(options, function (error, response, html) {
            $ = cheerio.load(html, {
                normalizeWhitespace: true
            });

            var rawMessages = $('tr', 'table');

            rawMessages.each(function (index, rawMessage) {

                /* Skip first child: Header-controls*/
                if (index == 0)
                    return;

                var message = {
                    id     : $('input[name="_table:Select"]', rawMessage).attr('value'),
                    date   : $('.messageDate', rawMessage).text(),
                    read   : ($('td[style*="font-weight:bold;"]', rawMessage).length ? false : true),
                    from   : $('.messageFrom', rawMessage).text(),
                    subject: $('.messageSubject', rawMessage).text(),
                    body   : $('.messageBody', rawMessage).text()
                }

                self.messages.push(message);

                if (index == rawMessages.length - 1)
                    cb();

            });

        });
    }

    /**
     * fetchMessages
     * - Fetches all messages
     */
    this.fetchMessage = function (messageId, cb) {
        var self = this;

        var options = {
            url: this.url + 'Messages/view_message.aspx' +
                '?MessageFolderId=1&MessageId=' + messageId,
            jar: this.cookieJar
        }

        request(options, function (error, response, html) {
            $ = cheerio.load(html, {
                normalizeWhitespace: true
            });

            var message = {
                from    : $('td', '.readMessageHeader').first().text(),
                subject : $('h1.ccl-pageheader').text(),
                body    : $('.readMessageBody').text()
            }

            cb(message);
        });
    }

    /**
     * fetchNotifications
     * - Fetches notifications
     */
     this.fetchNotifications = function (cb) {
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

                 if (index == rawNotifications.length - 1)
                     cb();
             });
         });
     }

    /**
     * fetchCourses
     * - Fetches the courses
     */
    this.fetchCourses = function (cb) {
        var self = this;

        var options = {
            url: this.url + 'Dashboard/Dashboard.aspx',
            jar: this.cookieJar
        }

        request(options, function (error, response, html) {
            $ = cheerio.load(html, {
                normalizeWhitespace: true
            });

            var rawCourses = $('.itsl-widget-content-ul', '.itsl-cb-courses').children('li');

            rawCourses.each(function (index, rawCourse) {
                var course = {
                    id   : $(rawCourse).children('a').attr('href')
                              .replace('/main.aspx?CourseID=', ''),
                    title: $(rawCourse).children('a').text()
                }

                self.courses.push(course);

                if (index == rawCourses.length - 1)
                    cb();
            });
        });
    }

    /**
     * fetchBulletins
     * - Fetches the bulletins for a course
     */
    this.fetchBulletins = function (courseId, cb) {
        var self = this;

        var options = {
            url: this.url + 'Course/course.aspx?CourseId=' + courseId,
            jar: this.cookieJar
        }

        request(options, function (error, response, html) {
            $ = cheerio.load(html, {
                normalizeWhitespace: true
            });

            self.bulletins[courseId] = [];
            var rawBulletins = $('.itsl-widget-content-ul', '.itsl-cb-news').children('li');

            rawBulletins.each(function (index, rawBulletin) {
                var bulletin = {
                    title   : $(rawBulletin).children('h2').text().trim(),
                    body    : $(rawBulletin).children('div.userinput').text(),
                    from    : $(rawBulletin).children('.itsl-widget-extrainfo').children('a').text()
                }

                self.bulletins[courseId].push(bulletin);

                if (index == rawBulletins.length - 1)
                    cb();
            });
        });
    }

    /**
     * bulletinsTable
     * - Spits out a formatted table of bulletins for a course
     */
     this.bulletinsTable = function (courseId) {
         var table = new Table({
             head: ['Title', 'From'],
             style: {
                 compact: true,
                 'padding-left': 1
             }
         });

         this.getBulletins(courseId).forEach(function (bulletin) {
             table.push([bulletin.title, bulletin.from]);
         });

         return table.toString();
     }

    /**
     * coursesTable
     * - Spits out a formatted table of each course
     */
     this.courseTable = function () {
         var table = new Table({
             head: ['Id', 'Course title'],
             style: {
                 compact: true,
                 'padding-left': 1
             }
         });

         this.getCourses().forEach(function (course) {
             table.push([course.id, course.title]);
         });

         return table.toString();
     }

    /**
     * inboxTable
     * - Spits out a formatted table of the inbox
     */
     this.inboxTable = function () {
         var table = new Table({
             head: ['Id', 'Date', 'From', 'Subject'],
             style: {
                 compact: true,
                 'padding-left': 1
             }
         });

         this.getUnreadMessages().forEach(function (message) {
             table.push([message.id, message.date, message.from, message.subject]);
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
