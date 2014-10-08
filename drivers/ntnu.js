var request   = require('request');
var cheerio   = require('cheerio');

module.exports = function (username, password, cookieJar, success, fail) {

    /*
     * Set URL on which the authentication cookies retrieved can be used.
     */
    this.schoolUrl = "https://itslearning.com";

    /**
     * Step 1: Obtain authState-token
     */
    var options = {
        url: 'https://sats.itea.ntnu.no/sso-wrapper/web/wrapper?target=itslearning',
        jar: cookieJar,
        followAllRedirects: true
    };

    request(options, function (error, response, html) {

        if (error)
            fail(error);

        $ = cheerio.load(html);

        /**
         * Step 2: Authenticate with credentials + authState
         */
        var formAction = this.redirects[this.redirects.length-1].redirectUri;
        var formValues = {
            feidename     : username,
            password      : password,
            authState     : $('input[name="AuthState"]').attr('value'),
            org           : 'ntnu.no'
        }

        var authOptions = {
            url: formAction,
            method: 'POST',
            form: formValues,
            jar: cookieJar
        }

        request(authOptions, function (error, response, html) {

            if (error)
                fail(error);

            $ = cheerio.load(html);

            /**
             * Step 3: Obtain SAMLResponse and RelaySate
             */
            var samlOptions = {
                url         : $('form').attr('action'),
                method      : 'POST',
                form: {
                    SAMLResponse: $('input[name="SAMLResponse"]').attr('value'),
                    RelayState  : $('input[name="RelayState"]').attr('value')
                },
                jar: cookieJar,
                followAllRedirects: true
            }

            request(samlOptions, function (error, response, html) {
                if (!error)
                    success();
                else
                    fail(error);
            });
        });
    });
}
