var request    = require('request');
var url        = require('url');
var path       = require('path');
var bodyParser = require('body-parser');
var express    = require("express");
var app        = express();
var config     = require("./config");
var oauth_kong = require("./kong");
var logger     = require("./logger")

// app.set('view engine', 'jade');
app.set('view engine', 'pug');
app.use(bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

// Accept every SSL certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function load_env_variable(name) {
  var value = process.env[name];
  if (value) {
    console.log(name + " is " + value);
    return value;
  } else {
    console.error("You need to specify a value for the environment variable: " + name);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------------------------------

/*
  This is the secret provision key that the plugin has generated
  after being added to the API
*/
oauth_kong.PROVISION_KEY = config.loadFromEnv ? load_env_variable("PROVISION_KEY") : config.PROVISION_KEY;

/*
  URLs to Kong
*/
oauth_kong.KONG_ADMIN_SERVER = config.loadFromEnv ? load_env_variable("KONG_ADMIN_SERVER") : config.KONG_ADMIN_SERVER;
oauth_kong.KONG_API_SERVER = config.loadFromEnv ? load_env_variable("KONG_API_SERVER") : config.KONG_API_SERVER;

/*
  The API Public DNS, required later when making a request
  to authorize the OAuth 2.0 client application
*/
oauth_kong.API_PUBLIC_DNS = config.loadFromEnv ? load_env_variable("API_PUBLIC_DNS") : config.API_PUBLIC_DNS;

/*
  The API URI
*/
oauth_kong.API_URI = config.loadFromEnv ? load_env_variable("API_URI") : config.API_URI;


// -----------------------------------------------------------------------------------------------------

/* 
  The scopes that we support, with their extended
  description for a nicer frontend user experience
*/
var SCOPE_DESCRIPTIONS = config.loadFromEnv ? JSON.parse(load_env_variable("SCOPES")) : config.SCOPES; //The scopes that we support, with their extended


var CLIENT_APP_URL = config.loadFromEnv ? JSON.parse(load_env_variable("CLIENT_APP_URL")) : config.CLIENT_APP_URL;

var CLIENT_ID = config.loadFromEnv ? JSON.parse(load_env_variable("CLIENT_ID")) : config.CLIENT_ID;

var CLIENT_SECRET = config.loadFromEnv ? JSON.parse(load_env_variable("CLIENT_ID")) : config.CLIENT_SECRET;


// -----------------------------------------------------------------------------------------------------


/*
  The route that shows the authorization page
*/
app.get('/authorize', function (req, res) {
    var querystring = url.parse(req.url, true).query;
    oauth_kong.get_application_name(querystring.client_id, function (application_name) {
        if (application_name) {
            res.render('authorization', {
                client_id: querystring.client_id,
                response_type: querystring.response_type,
                scope: querystring.scope,
                state: "Authorization Code Process",
                application_name: application_name,
                SCOPE_DESCRIPTIONS: SCOPE_DESCRIPTIONS
            });
        } else {
            res.status(403).send("Invalid client_id for Authorization Code");
        }
    });
});

/*
  The route that handles the form submit, that will
  authorize the client application and redirect the user
*/
app.post('/authorize', function (req, res) {
    oauth_kong.authorize_ac(
        req.body.client_id,
        req.body.scope,
        req.body.state,
        function (success, data) {
            if(success) {
                var redirect_uri = data.redirect_uri ;
                res.redirect(redirect_uri);
            } else {
                res.status(200).send(data);
            }
        });
});

//-----------------------------------------------------------------------
/**
 * to simulate getCode process of OAuth Server, callback by Kong
 * */
app.get("/simulate/getCode", function (req, res) {

    var querystring = url.parse(req.url, true).query;
    var code = querystring.code;
    var refresh_token = querystring.refresh_token;
    var state = querystring.state;

    var getTokenUrl = "";
    if(code != null && code != undefined && code != "") {
        getTokenUrl = CLIENT_APP_URL + "/simulate/getToken?client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET + "&code=" + code;
    }

    var refreshTokenUrl = "";
    if(refresh_token != null && refresh_token != undefined && refresh_token != "") {
        refreshTokenUrl = CLIENT_APP_URL + "/simulate/refresh_token?client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET + "&refresh_token=" + refresh_token
    }

    console.log("code: " + code);
    console.log("refresh_token: " + refresh_token);
    console.log("state: " + state)
    console.log("getTokenUrl: " + getTokenUrl);
    console.log("refreshTokenUrl: " + refreshTokenUrl);

    res.render('get_code', {
        getTokenUrl: getTokenUrl,
        refreshTokenUrl: refreshTokenUrl,
        state: state
    });

});


/**
 * to simulate getToken process of OAuth Server
 * */
app.get("/simulate/getToken", function (req, res) {
    var querystring = url.parse(req.url, true).query;
    oauth_kong.authorize_ac_2nd_step(
        querystring.client_id,
        querystring.client_secret,
        querystring.code,
        function (data) {
            console.log(data);
            res.status(200).send(data);
        }
    );
});


app.get('/simulate/refresh_token', function (req, res) {
    var querystring = url.parse(req.url, true).query;
    oauth_kong.refresh_token(
        querystring.client_id,
        querystring.client_secret,
        querystring.refresh_token,
        function (data) {
            console.log(data);
            res.status(200).send(data);
        });
});


//-----------------------------------------------------------------------

/*
 The route that shows the authorization page
 */
app.get('/authorize_ig', function (req, res) {
    var querystring = url.parse(req.url, true).query;
    oauth_kong.get_application_name(querystring.client_id, function (application_name) {
        if (application_name) {
            res.render('authorization_ig', {
                client_id: querystring.client_id,
                response_type: querystring.response_type,
                scope: querystring.scope,
                state: "Implicit Grant Process",
                application_name: application_name,
                SCOPE_DESCRIPTIONS: SCOPE_DESCRIPTIONS
            });
        } else {
            res.status(403).send("Invalid client_id for Implicit Grant");
        }
    });
});


/*
 The route that handles the form submit, that will
 authorize the client application and redirect the user
 */
app.post('/authorize_ig', function (req, res) {
    oauth_kong.authorize_ig(
        req.body.client_id,
        req.body.scope,
        req.body.state,
        function (redirect_uri) {
            logger.warn(redirect_uri);
            res.redirect(redirect_uri);
        });
});


//-----------------------------------------------------------------------


/*
 The route that shows the auth_by_pwd page
 */
app.get('/authorize_by_pwd', function (req, res) {
    var querystring = url.parse(req.url, true).query;
    oauth_kong.get_application_name(querystring.client_id, function (application_name) {
        if (application_name) {
            res.render('authorization_pc', {
                client_id: querystring.client_id,
                client_secret: querystring.client_secret,
                scope: querystring.scope,
                state: "Password Credential Process",
                application_name: application_name,
                SCOPE_DESCRIPTIONS: SCOPE_DESCRIPTIONS
            });
        } else {
            res.status(403).send("Invalid client_id for Password Credentials");
        }
    });
});

/*
 The route that handles the form submit, that will
 authorize the client application by password credential
 */
app.post('/authorize_by_pwd', function (req, res) {

    oauth_kong.authorize_pc2(
        req.body.username,
        req.body.password,
        req.body.client_id,
        req.body.client_secret,
        req.body.scope,
        req.body.state,
        function (data) {
            console.log(data);
            if(data.refresh_token) {
                res.redirect("/refresh_token"
                    + "?client_id=" + req.body.client_id
                    + "&client_secret=" + req.body.client_secret
                    + "&refresh_token=" + data.refresh_token
                    + "&token_type=" + data.token_type
                    + "&access_token=" + data.access_token
                    + "&expires_in=" + data.expires_in
                );
            } else {
                res.status(200).send(data);
            }
        }
    );
});



//-----------------------------------------------------------------------


/*
 The route that shows the authorization page
 */
app.get('/authorize_cc', function (req, res) {
    var querystring = url.parse(req.url, true).query;
    oauth_kong.get_application_name(querystring.client_id, function (application_name) {
        if (application_name) {
            res.render('authorization_cc', {
                client_id: querystring.client_id,
                client_secret: querystring.client_secret,
                scope: querystring.scope,
                state: "Client Credential Process",
                application_name: application_name,
                SCOPE_DESCRIPTIONS: SCOPE_DESCRIPTIONS
            });
        } else {
            res.status(403).send("Invalid client_id for Client Credentials");
        }
    });
});

/*
 The route that handles the form submit, that will
 authorize the client application and redirect the user
 */
app.post('/authorize_cc', function (req, res) {
    oauth_kong.authorize_cc(
        req.body.client_id,
        req.body.client_secret,
        req.body.scope,
        req.body.state,
        function (data) {
            console.log(data);
            res.status(200).send(data);
        });
});


//-----------------------------------------------------------------------



/*
 The route that shows the refresh_token page
 */
app.get('/refresh_token', function (req, res) {
    var querystring = url.parse(req.url, true).query;

    res.render('refresh_token', {
        client_id: querystring.client_id,
        client_secret: querystring.client_secret,
        refresh_token: querystring.refresh_token,
        token_type: querystring.token_type,
        access_token: querystring.access_token,
        expires_in: querystring.expires_in
    });

});


/*
 The route that handles the form submit, that will
 refresh the access token
 */
app.post('/refresh_token', function (req, res) {
    oauth_kong.refresh_token(
        req.body.client_id,
        req.body.client_secret,
        req.body.refresh_token,
        function (data) {
            console.log(data);
            res.status(200).send(data);
        });
});



//-----------------------------------------------------------------------

/*
  Index page
*/
app.get("/", function(req, res) {
  res.render('index', {
      client_app_url: CLIENT_APP_URL,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
  });
});

//-----------------------------------------------------------------------


app.listen(3000);

console.log("Running at Port 3000");

//http://127.0.0.1:3000/authorize?response_type=code&scope=email%20address&client_id=c683e5e2fbb9487898f81fbc0d6ffb5b
//http://127.0.0.1:3000/simulate/getToken?client_id=c683e5e2fbb9487898f81fbc0d6ffb5b&client_secret=17e49c221d1840a58fdf84b937144000&grant_type=authorization_code&code=c16fe277a94a4119a57f7e5aa648f654

//http://127.0.0.1:3000/authorize_ig?response_type=token&scope=email%20address&client_id=c683e5e2fbb9487898f81fbc0d6ffb5b

//http://127.0.0.1:3000/authorize_by_pwd?client_id=c683e5e2fbb9487898f81fbc0d6ffb5b&client_secret=17e49c221d1840a58fdf84b937144000&scope=email%20address

//http://127.0.0.1:3000/authorize_cc?client_id=c683e5e2fbb9487898f81fbc0d6ffb5b&client_secret=17e49c221d1840a58fdf84b937144000&scope=email%20address
