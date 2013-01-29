bugsense-jira-proxy
===================

This simple nodejs app which emulates JIRA. You can send your issues directly from bugsense to your Redmine instance.

### how to use?

1. `git clone git://github.com/oroce/bugsense-jira-proxy.git`
2. `npm install`
3. generate https cert (it is required by bugsense, won't work with plain http server, or you can use reverse proxy)
	mkdir -p cert
	openssl genrsa -out cert/private-key.pem 1024 
	openssl req -new -key cert/private-key.pem -out cert/csr.pem 
	openssl x509 -req -in cert/csr.pem -signkey cert/key.pem -out cert/private-cert.pem
4. run `REDMINE_HOST=[YOUR REDMINE URL] node app.js` (watch out, there's no trailing slash!), or require app.js from your app
5. Setup jira at bugsense: https://www.bugsense.com/docs/other

### Authentication

Bugsense forces to use plain username, password authentication, but you don't have to do this:)

There are few options:
* set your username and password on bugsense
* set redmine access key as an environment variable (REDMINE_ACCESS_KEY) [Get your own](http://www.redmine.org/projects/redmine/wiki/Rest_api#Authentication)
* set your username and password as environment variables (REDMINE_USER, REDMINE_PASSWORD)

### but WHY?

Well, we use redmine and bugsense and it's annoying and slow to copy manually creating issues in redmine.

And you can use this project as a bootstrap to connect bugsense with other issue systems, like bitbucket, github, etc...

### accepted environment variables

* REDMINE_ACCESS_KEY: redmine rest api access key, it's optional
* REDMINE_USER: redmine username, it's optional
* REDMINE_PASSWORD: redmine password, it's optional
* REDMINE_HOST: your redmine host, it is required
* BASE_URL: proxy's base url (you don't have to provide it, it'll be guessed from `req.protocol` and `req.headers.host` or `req.headers["x-forwarded-host"]`if you're using reverse proxy)
* PORT: port to listen on

### documentation

* [JIRA REST API](https://docs.atlassian.com/jira/REST/latest/)
* [Redmine REST API](http://www.redmine.org/projects/redmine/wiki/Rest_api#API-Description)
* Bugsense: oh wait, there's no docs, but that's what reverse engineering is for.:)

### todo

* implement somehow webhooks