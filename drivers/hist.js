var request   = require('request');
var cheerio   = require('cheerio');

module.exports = function (username, password, cookieJar, success, fail) {

    /*
     * Set URL on which the authentication cookies retrieved can be used.
     */
    this.schoolUrl = "https://www.itslearning.com/";
    
    /*
     * Set the ID for the school we're loading
     */
    this.customerId = 136; /* Sør-Trøndelag University College*/
    
    /*
     * Set domain for this school
     */
    var domain = "hist.no";
    /*
     * Set subdomain for itslearning.com for this scool
     */
    var subDomain = "hist";
    

    /**
     * Step 1: Obtain authState-token
     */
    var options = {
        url: 'https://www.itslearning.com/elogin/default.aspx?CustomerId=' + this.customerId,
        jar: cookieJar,
        followAllRedirects: true
    };

    request(options, function (error, response, html) {

        if (error)
            fail(error);

        $ = cheerio.load(html);

        var formValues = {
            __LASTFOCUS: '',
            __EVENTTARGET: 'ctl00$ContentPlaceHolder1$federatedLoginButtons$ctl00$ctl00', /* "Log in with Feide" */
            __EVENTARGUMENT: ''
        };
        $('input').each(function() {
            var $this = $(this);
            /* Do not send this field or else itslearning thinks this is a native login */
            if ($this.attr('name') != 'ctl00$ContentPlaceHolder1$nativeLoginButton')
                formValues[$this.attr('name')] = $this.attr('value') ? $this.attr('value') : '';
        });

        var formOptions = {
            url: 'https://' + subDomain + '.itslearning.com/Index.aspx',
            method: 'POST',
            form: formValues,
            jar: cookieJar,
            followAllRedirects: true
        }


        request(formOptions, function (error, response, html) {

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
                AuthState     : $('input[name="AuthState"]').attr('value'),
                org           : domain,
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
                    
                    if (error)
                        fail(error);
                    
                    $ = cheerio.load(html);
                    
                    /**
                     * Step 4: For some reason, we are redirected to an _almost_ identical page where we need to do yet another redirect.
                     * The submission code is the same, but the actual markup in the page is slightly different (see eg. body onload)
                     */
                    var samlOptions2 = {
                        url         : $('form').attr('action'),
                        method      : 'POST',
                        form: {
                            SAMLResponse: $('input[name="SAMLResponse"]').attr('value'),
                            RelayState  : $('input[name="RelayState"]').attr('value')
                        },
                        jar: cookieJar,
                        followAllRedirects: true
                    }
                    
                    request(samlOptions2, function (error, response, html) {
                        if (!error)
                            success();
                        else
                            fail(error);
                    });
                });
            });
        });
    });
}
