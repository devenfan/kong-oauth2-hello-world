# OAuth 2.0 Hello World for Kong

This is a simple node.js + express.js + jade(now is pug) application that demonstrates a simple implementation of the OAuth 2.0 authorization page required to make the [OAuth 2.0 plugin](http://getkong.org/plugins/oauth2-authentication) work on [Kong 0.10.3](getkong.org).

# Files

* `app.js`, which handles the server and contains below routes:
  * `GET  /`, that shows the index page with 4 types of OAuth process
  * `GET  /authorize`, that shows the [Authorization Code] page 
  * `POST /authorize`, that handles the form submit and triggers the [Authorization Code] process on Kong
  * `GET  /authorize_ig`, that shows the [Implicit Grant] page 
  * `POST /authorize_ig`, that handles the form submit and triggers the [Implicit Grant] process on Kong
  * `GET  /authorize_by_pwd`, that shows the [Password Credential] page 
  * `POST /authorize_by_pwd`, that handles the form submit and triggers the [Password Credential] process on Kong
  * `GET  /authorize_cc`, that shows the [Client Credential] page 
  * `POST /authorize_cc`, that handles the form submit and triggers the [Client Credential] process on Kong
  
* `kong.js`, which was defined hwo to invoke Kong OAuth methods
* `config.js`, which was defined the testing parameters of this demo application, you may change this file firstly

# Installing dependencies

Execute

```shell
npm install
```

# Setting up the environment

To run this project, execute the following operations.

* Make sure you have Kong 0.10.3 running. We assume Kong is running at `127.0.0.1` with the default ports.

* Let's add a simple test API:

```shell
curl -i -X POST --url http://10.5.52.56:8001/apis/   \
     --data "name=test"   \
     --data "uris=/test"  \
     --data="upstream_url=http://httpbin.org"
```

* Let's add the OAuth 2.0 plugin, with three available scopes:

```shell
curl -i -X POST http://10.5.52.56:8001/apis/test/plugins \
     --data "name=oauth2"  \
     --data "config.enable_authorization_code=true"  \ 
     --data "config.enable_client_credentials=true"  \
     --data "config.enable_implicit_grant=true"  \
     --data "config.enable_password_grant=true"  \ 
     --data "config.accept_http_if_already_terminated=true"  \
     --data "config.global_credentials=false" \
     --data "config.provision_key=1f2b8d4baadb4b6f93c82b1599cad575"

```


The `provision_key` will be sent by the web application when communicating with Kong, to securely authenticate itself with Kong.

* Let's create a Kong consumer (called `testConsumer`):

```shell

curl -i -X POST http://10.5.52.56:8001/consumers/  \
     --data "username=testConsumer" \
     --data "custom_id=testConsumerId"
```

* And the first OAuth 2.0 client application called `testConsumerApp`:

```shell

curl -i -X POST http://10.5.52.56:8001/consumers/testConsumerId/oauth2 \
     --data "name=testConsumerApp" \
     --data "client_id=c683e5e2fbb9487898f81fbc0d6ffb5b" \
     --data="client_secret=17e49c221d1840a58fdf84b937144000" \
     --data="redirect_uri=http://10.5.227.17:3000/simulate/getCode"

```

Here entry point `/simulate/getCode` inside `redirect_url` will handle the callback of Kong OAuth plugin when authorize.

# Running the web application

Now that Kong has all the data configured, we can start our application using the `provision_key` that has been returned when we added the plugin:

```shell
# Exporting some environment variables used by the Node.js application
export PROVISION_KEY="1f2b8d4baadb4b6f93c82b1599cad575"
export KONG_ADMIN_SERVER="http://your_kong_server:8001"
export KONG_API_SERVER="https://your_kong_server:8443"
export API_PUBLIC_DNS="test.com"
export API_URI="/test"
export CLIENT_ID: "c683e5e2fbb9487898f81fbc0d6ffb5b",
export CLIENT_SECRET: "17e49c221d1840a58fdf84b937144000",
export SCOPES="{ \
  \"email\": \"Grant permissions to read your email address\", \
  \"address\": \"Grant permissions to read your address information\", \
  \"phone\": \"Grant permissions to read your mobile phone number\" \
}",
export CLIENT_APP_URL: "http://127.0.0.1:3000"

# Starting the node.js application
node app.js
```

# Testing the Authorization Flow

To start the authorization flow we need to simulate the request that the client application will execute when redirecting the user to your API. This request will include the `response_type` parameter, the `client_id` and the `scope` requested.

*Note:* In our example we are skipping the log-in of the user, which is something you will do in production **before** showing the authorization page.

With your browser, go to `http://127.0.0.1:3000/authorize?response_type=code&scope=email%20address&client_id=318f98be1453427bc2937fceab9811bd` to show the authrorization page. You will see a page like:

![Authorization Prompt](http://i.imgur.com/JdY0H0K.png)

After clicking the "Authorize" button, you should be redirected to the `redirect_uri` we set up before with a `code` parameter in the querystring, like:

```
http://getkong.org/?code=ad286cf6694d40aac06eff2797b7208d
```

For testing purposes we set the `redirect_uri` to `http://getkong.org`, but in production this will be an URL that the client application will be able to read to parse the code and exchange it with an access token.


# Conclusions

To retrieve an `access_token` by [Authorization Code] process you can now execute the following request:

```shell

# Get Code
curl -i -X POST  --url  https://10.5.52.56:8443/test/oauth2/authorize \
     --data "client_id=c683e5e2fbb9487898f81fbc0d6ffb5b" \
     --data "provision_key=1f2b8d4baadb4b6f93c82b1599cad575" \
     --data "response_type=code" \
     --data "scope=email address" \
     --data "authenticated_userid=userid123456" \
     --insecure
   
# Get Token
curl -i -X POST  --url  https://10.5.52.56:8443/test/oauth2/token \
     --data "client_id=c683e5e2fbb9487898f81fbc0d6ffb5b"  \
     --data "client_secret=17e49c221d1840a58fdf84b937144000" \
     --data "grant_type=authorization_code" \
     --data "code=0c14324d66bf4d6abbe3003c22b11d22" \
     --insecure
     
# Refresh Token
curl -i -X POST  --url  https://10.5.52.56:8443/test/oauth2/token \
     --data "client_id=c683e5e2fbb9487898f81fbc0d6ffb5b" \
     --data "client_secret=17e49c221d1840a58fdf84b937144000" \
     --data "provision_key=1f2b8d4baadb4b6f93c82b1599cad575" \ 
     --data "grant_type=refresh_token" \
     --data "refresh_token=bebb2a853125435a857b4cc2fc542fb1" \
     --insecure


```
