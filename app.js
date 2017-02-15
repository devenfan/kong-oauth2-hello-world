var request    = require('request');
var url        = require('url');
var bodyParser = require('body-parser');
var express    = require("express");
var app        = express();
var config     = require("./config")

app.set('view engine', 'jade');
app.use(bodyParser());

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

/*
  This is the secret provision key that the plugin has generated
  after being added to the API
*/
var PROVISION_KEY = config.loadFromEnv ? load_env_variable("PROVISION_KEY") : config.PROVISION_KEY;

/*
  URLs to Kong
*/
var KONG_ADMIN = config.loadFromEnv ? load_env_variable("KONG_ADMIN") : config.KONG_ADMIN;
var KONG_API = config.loadFromEnv ? load_env_variable("KONG_API") : config.KONG_API;

/*
  The API Public DNS, required later when making a request
  to authorize the OAuth 2.0 client application
*/
var API_PUBLIC_DNS = config.loadFromEnv ? load_env_variable("API_PUBLIC_DNS") : config.API_PUBLIC_DNS;

/* 
  The scopes that we support, with their extended
  description for a nicer frontend user experience
*/
var SCOPE_DESCRIPTIONS = config.loadFromEnv ? JSON.parse(load_env_variable("SCOPES")) : config.SCOPES; //The scopes that we support, with their extended





/*
  Retrieves the OAuth 2.0 client application name from
  a given client_id - used for a nicer fronted experience
*/
function get_application_name(client_id, callback) {
  request({
    method: "GET",
    url: KONG_ADMIN + "/oauth2",
    qs: { client_id: client_id }
  }, function(error, response, body) {
    var application_name;
    if (client_id && !error) {
      var json_response = JSON.parse(body);
      if (json_response.data.length == 1) {
        application_name = json_response.data[0].name;
      }
    }
    callback(application_name);
  });
}

/*
  The POST request to Kong that will actually try to
  authorize the OAuth 2.0 client application after the
  user submits the form
*/
function authorize(client_id, response_type, scope, callback) {
  request({
    method: "POST",
    url: KONG_API + "/oauth2/authorize",
    headers: { host: API_PUBLIC_DNS },
    form: { 
      client_id: client_id, 
      response_type: response_type, 
      scope: scope, 
      provision_key: PROVISION_KEY,
      authenticated_userid: "userid123" // Hard-coding this value (it should be the logged-in user ID)
    }
  }, function(error, response, body) {
    callback(JSON.parse(body).redirect_uri);
  });
}

/*
  The route that shows the authorization page
*/
app.get('/authorize', function(req, res) {
  var querystring = url.parse(req.url, true).query;
  get_application_name(querystring.client_id, function(application_name) {
    if (application_name) {
      res.render('authorization', { 
        client_id: querystring.client_id,
        response_type: querystring.response_type,
        scope: querystring.scope,
        application_name: application_name,
        SCOPE_DESCRIPTIONS: SCOPE_DESCRIPTIONS 
      });
    } else {
      res.status(403).send("Invalid client_id");
    }
  });
});

/*
  The route that handles the form submit, that will
  authorize the client application and redirect the user
*/
app.post('/authorize', function(req, res) {
  authorize(req.body.client_id, req.body.response_type, req.body.scope, function(redirect_uri) {
    res.redirect(redirect_uri);
  });
});

//-----------------------------------------------------------------------
/**
 * to simulate getCode process of OAuth Server, callback by Kong
 * */
app.get("/simulate/getCode", function(req, res) {
    var querystring = url.parse(req.url, true).query;
    var code = querystring.code;
    console.log("code: " + code);
    res.status(200).send(code);
});

/**
 * to simulate getToken process of OAuth Server
 * */
app.get("/simulate/getToken", function(req, res) {
    var querystring = url.parse(req.url, true).query;
    request({
        method: "POST",
        url: KONG_API + "/oauth2/token",
        headers: { host: API_PUBLIC_DNS },
        form: {
            client_id: querystring.client_id,
            client_secret: querystring.client_secret,
            grant_type: querystring.grant_type,
            code: querystring.code
        }
    }, function(error, response, body) {
        var dataWithToken = JSON.parse(body);
        console.log(dataWithToken);
        res.status(200).send(dataWithToken);
    });
});

//-----------------------------------------------------------------------

/*
  Index page
*/
app.get("/", function(req, res) {
  res.render('index');
});




app.listen(3000);

console.log("Running at Port 3000");

//http://127.0.0.1:3000/authorize?response_type=code&scope=email%20address&client_id=c683e5e2fbb9487898f81fbc0d6ffb5b
//http://127.0.0.1:3000/simulate/getToken?client_id=c683e5e2fbb9487898f81fbc0d6ffb5b&client_secret=17e49c221d1840a58fdf84b937144000&grant_type=authorization_code&code=c16fe277a94a4119a57f7e5aa648f654

