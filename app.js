"use strict";
/**
 * Module dependencies.
 */

var express = require("express"),
	Redmine = require( "./lib/redmine" );

var app = express();

var redmine = new Redmine({
	user: process.env.REDMINE_USER,
	password: process.env.REDMINE_PASSWORD,
	accessKey: process.env.REDMINE_ACCESS_KEY,
	redmineUrl: process.env.REDMINE_HOST,
	baseUrl: process.env.BASE_URL
});

app.configure("development", function(){
	app.use( express.logger( "dev" ) );
	app.use(express.errorHandler());
});

app.configure(function(){
	app.set("port", process.env.PORT || 3000);
	app.enable( "trust proxy" );
	app.use(express.favicon());
	app.use(express.bodyParser());
	app.use(express.cookieParser("shhhh, very secret"));
	app.use(express.session());
	app.use(express.methodOverride());
	app.use(app.router);
});

app.post( "/rest/auth/:apiVersion/session", redmine.prepareSession.bind( redmine ), redmine.getSession.bind( redmine ) );

app.get( "/rest/api/:apiVersion/project", redmine.isAuthenticated, redmine.getProjects.bind( redmine ) );

app.get( "/rest/api/:apiVersion/project/:projectId/versions", redmine.isAuthenticated, redmine.getProjectVersions.bind( redmine ) );

app.post( "/rest/api/:apiVersion/issue", redmine.isAuthenticated, redmine.createIssue.bind( redmine ) );

app.get( "/browse/:issueId", redmine.showIssue.bind( redmine ) );

/* it's not implemented yet, but it would be useful:) */
app.post( "/rest/webhooks/1.0/webhook", redmine.isAuthenticated, function( req, res ){
	res.send( 503 );
});

/* it's not implemented yet */
app.post( "/rest/api/:apiVersion/issue/:issueId/remotelink", redmine.isAuthenticated, function( req, res ){
	res.send( 503 );
});

app.post( "/rest/api/:apiVersion/:issueId/remotelink", redmine.isAuthenticated, redmine.remoteLink.bind( redmine ) );
if( !module.parent ){
	var https = require( "https" ),
			fs = require( "fs" );

	var httpsOptions = {
		key: fs.readFileSync( __dirname + "/cert/private-key.pem" ),
		cert: fs.readFileSync( __dirname + "/cert/public-cert.pem" )
	};

	https.createServer( httpsOptions, app).listen( app.get( "port" ), function( err ){
		console.log("Express secure server listening on port " + app.get("port"), err );
	});
}
else{
	module.exports = app;
}