/**
 * To invoke Kong OAuth API.
 */

var request    = require('request');
var url        = require('url');

var oauth_kong = {


    // --------------------------------------------------------------

    KONG_ADMIN: null,
    KONG_API: null,
    API_PUBLIC_DNS: null,
    API_URI: null,
    PROVISION_KEY: null,
    AUTHENTICATED_USERID: "userid123",


    // --------------------------------------------------------------

    /*
     Retrieves the OAuth 2.0 client application name from
     a given client_id - used for a nicer fronted experience
     */
    get_application_name: function (client_id, callback) {
        request({
            method: "GET",
            url: this.KONG_ADMIN + "/oauth2",    //获取oauth2 appName的接口
            qs: {client_id: client_id}
        }, function (error, response, body) {
            var application_name;
            if (client_id && !error) {
                var json_response = JSON.parse(body);
                if (json_response.data.length == 1) {
                    application_name = json_response.data[0].name;
                }
            }
            callback(application_name);
        });
    },

    // --------------------------------------------------------------

    /*
     The POST request to Kong that will actually try to
     authorize the OAuth 2.0 client application after the
     user submits the form.
     If succeed, the authorization code will be callback
     */
    authorize_ac: function (client_id, scope, callback) {
        request({
            method: "POST",
            url: this.KONG_API + this.API_URI + "/oauth2/authorize",  //进行oauth2验证的接口
            // headers: {
            //     "X-Host-Override": this.API_PUBLIC_DNS,
            //     "Host": this.API_PUBLIC_DNS
            // },
            form: {
                client_id: client_id,
                response_type: "code",
                scope: scope,
                provision_key: this.PROVISION_KEY,
                authenticated_userid: this.AUTHENTICATED_USERID // Hard-coding this value (it should be the logged-in user ID)
            }
        }, function (error, response, body) {
            var respBody = JSON.parse(body);
            if(error || respBody.error || !respBody.redirect_uri) {
                callback(false, respBody)
            } else {
                callback(true, respBody.redirect_uri);
            }
        });
    },

    /**
     * get token by authorization code
     * */
    authorize_ac_2nd_step : function (client_id, client_secret, code, callback) {
        request({
            method: "POST",
            url: this.KONG_API + this.API_URI + "/oauth2/token",
            headers: { host: this.API_PUBLIC_DNS },
            form: {
                client_id: client_id,
                client_secret: client_secret,
                grant_type: "authorization_code",
                code: code
            }
        }, function(error, response, body) {
            callback(JSON.parse(body));
        });
    },

    //Must use JSON format
    refresh_token : function(client_id, client_secret, refresh_token, callback){
        request({
            method: "POST",
            url: this.KONG_API + this.API_URI + "/oauth2/token",
            headers: {
                host: this.API_PUBLIC_DNS,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                client_id: client_id,
                client_secret: client_secret,
                grant_type: "refresh_token",
                refresh_token: refresh_token,
                provision_key: this.PROVISION_KEY
            })
        }, function (error, response, body) {
            callback(JSON.parse(body));
        });
    },

    // --------------------------------------------------------------

    authorize_ig: function (client_id, scope, callback) {
        request({
            method: "POST",
            url: this.KONG_API + this.API_URI + "/oauth2/authorize",
            headers: {host: this.API_PUBLIC_DNS},
            form: {
                client_id: client_id,
                response_type: "token",
                scope: scope,
                provision_key: this.PROVISION_KEY,
                authenticated_userid: this.AUTHENTICATED_USERID // Hard-coding this value (it should be the logged-in user ID)
            }
        }, function (error, response, body) {
            callback(JSON.parse(body).redirect_uri);
        });
    },

    // --------------------------------------------------------------

    authorize_pc : function (username, password, client_id, client_secret, scope, callback) {
        request({
            method: "POST",
            url: this.KONG_API + this.API_URI + "/oauth2/token",
            headers: { host: this.API_PUBLIC_DNS },
            form: {
                username: username,
                password: password,
                client_id: client_id,
                client_secret: client_secret,
                grant_type: "password",
                scope: scope,
                provision_key: this.PROVISION_KEY,
                authenticated_userid: this.AUTHENTICATED_USERID // Hard-coding this value (it should be the logged-in user ID)
            }
        }, function (error, response, body) {
            callback(JSON.parse(body));
        });
    },

    authorize_pc2 : function (username, password, client_id, client_secret, scope, callback) {
        request({
            method: "POST",
            url: this.KONG_API + this.API_URI + "/oauth2/token",
            headers: {
                "X-Host-Override": this.API_PUBLIC_DNS,
                "host": this.API_PUBLIC_DNS,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password,
                client_id: client_id,
                client_secret: client_secret,
                grant_type: "password",
                scope: scope,
                provision_key: this.PROVISION_KEY,
                authenticated_userid: this.AUTHENTICATED_USERID // Hard-coding this value (it should be the logged-in user ID)
            })
        }, function (error, response, body) {
            callback(JSON.parse(body));
        });
    },

    // --------------------------------------------------------------

    authorize_cc : function (client_id, client_secret, scope, callback) {
        request({
            method: "POST",
            url: this.KONG_API + this.API_URI + "/oauth2/token",
            headers: {
                "X-Host-Override": this.API_PUBLIC_DNS,
                "host": this.API_PUBLIC_DNS,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                client_id: client_id,
                client_secret: client_secret,
                grant_type: "client_credentials",
                scope: scope,
                provision_key: this.PROVISION_KEY,
                authenticated_userid: this.AUTHENTICATED_USERID // Hard-coding this value (it should be the logged-in user ID)
            })
        }, function (error, response, body) {
            // console.log(response);
            // console.log(body);
            callback(JSON.parse(body));
        });
    },

};
module.exports = oauth_kong;
