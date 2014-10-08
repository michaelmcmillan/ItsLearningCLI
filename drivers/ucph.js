var request   = require('request');
var cheerio   = require('cheerio');

module.exports = function (username, password, cookieJar, success, fail) {

    /*
     * Set URL on which the authentication cookies retrieved can be used.
     */
    this.schoolUrl = "https://absalon.itslearning.com/";

    /**
     * Step 1: Obtain authState-token
     */
    var options = {
        url: 'https://intranet.ku.dk/CookieAuth.dll?GetLogon?curl=Z2F&reason=0&formdir=6',
        jar: cookieJar,
        followRedirects: true
    };

    request(options, function (error, response, html) {

        if (error) {
            fail(error);
        }

        $ = cheerio.load(html);

        /**
         * Step 2: Authenticate with credentials
         */
        var formAction = 'https://intranet.ku.dk/CookieAuth.dll?Logon';
        var formValues = {
            username: username,
            password: password,
            trusted: $('input[name="trusted"]').attr('value'),
            curl: $('input[name="curl"]').attr('value'),
            flags: $('input[name="flags"]').attr('value'),
            formdir: $('input[name="formdir"]').attr('value'),
        };

        var authOptions = {
            url: formAction,
            method: 'POST',
            form: formValues,
            jar: cookieJar,
            followRedirects: true,
        };

        /**
         * Step 3: Follow link which will generate our login-token.
         */
        request(authOptions, function (error, response, html) {
            var tokenOptions = {
                url: 'https://pabsws.ku.dk/index.aspx?starturl=main.aspx',
                jar: cookieJar,
                followRedirects: true,
            };

            request(tokenOptions, function (error, response, html) {
                if (!error) {
                    success();
                } else {
                    fail(error);
                }
            });
        });
    });
};
