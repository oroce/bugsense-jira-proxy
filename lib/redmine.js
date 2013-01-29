"use strict";
var request = require( "request" );
var moment = require( "moment" );
var Redmine = function _RedmineConstructor( options ){
	options || ( options = {} );

	this.redmineUrl = options.redmineUrl;
	this.baseUrl = options.baseUrl;
	this.user = options.user;
	this.password = options.password;
	this.accessKey = options.accessKey;
};

Redmine.prototype = {
	
	sendRequest: function( params, session, callback ){
		params.auth = {
			user: session.user,
			password: session.password
		};
		return request( params, callback );
	},
	prepareSession: function( req, res, next ){
		var body = req.body,
				user, password;
		if( this.user && this.password ){
			user = this.user;
			password = this.password;
		}
		else if( this.accessKey ){
			user = this.accessKey;
			password = "DUMMY"; // http://www.redmine.org/projects/redmine/wiki/Rest_api#Authentication
		}
		else if( typeof body === "object" && "username" in req.body && "password" in req.body ){
			user = req.body.username;
			password = req.body.password;
		}
		if( !user || !password ){
			console.error( "[prepareSession]", "No user" );
			return res.send( 401 );
		}
		req.session.regenerate(function(){
			req.session.user = user;
			req.session.password = password;
			next();
		});
		
	},
	getSession: function( req, res ){
		this.sendRequest({
			url: this.redmineUrl + "/projects.json"
		}, req.session, function( err, response, body ){
			if( !body ){
				return res.send(503);
			}
			if( response.statusCode === 200 ){
				res.send( "ok" );
			}
			res.send( response.statusCode );
		});
	},

	isAuthenticated: function( req, res, next ){
		if( req.session.user && req.session.password ){
			return next();
		}
		res.send( 401 );
	},

	getProjects: function( req, res ){
		this.sendRequest({
			url: this.redmineUrl + "/projects.json",
			json: true
		}, req.session, function( err, response, body ){
			if( !body ){
				return res.send(503);
			}
			if( response.statusCode === 200 ){
				var baseUrl = this.baseUrl || ( req.protocol + ( req.headers["x-forwarded-host"] ||req.headers.host ) );
				var projects = ( body.projects||[] ).map(function( project ){
					return {
						self: baseUrl + "/jira/rest/api/" + req.param( "jiraVersion" ) + "/project/" + project.identifier,
						id: project.id,
						name: project.name,
						key: project.id,
						avatarUrls: {
							"16x16": "http://www.example.com/jira/secure/projectavatar?size=small&pid=10000",
							"48x48": "http://www.example.com/jira/secure/projectavatar?size=large&pid=10000"
						}
					};
				});
				res.json( projects );
			}
			else{
				res.send( response.statusCode );
			}
		});
	},

	getProjectVersions: function( req, res ){
		this.sendRequest({
			url: this.redmineUrl + "/projects/" + req.param( "projectId" ) + "/versions.json",
			json: true
		}, req.session, function( err, response, body ){
			if( !body ){
				return res.send(503);
			}
			if( response.statusCode === 200 ){
				var baseUrl = this.baseUrl || ( req.protocol + ( req.headers["x-forwarded-host"] ||req.headers.host ) );
				var versions = ( body.versions||[] ).map(function( version ){
					return {
						self: baseUrl + "/jira/rest/api/" + req.param( "jiraVersion" ) + "/project/" + req.param( "projectId" ) + "/version/" + version.id,
						id: version.id,
						description: version.description,
						name: version.name,
						archived: false,
						released: version.status !== "open",
						releaseDate: version.due_date,
						overdue: version.status === "open" && moment( version.due_date, [ "YYYY/MM/DD" ] ).diff( new Date(), "days" ) < 0,
						userReleaseDate: version.due_date
					};
				});
				res.json( versions );
			}
			else{
				res.send( response.statusCode );
			}
		});
	},

	createIssue: function( req, res ){
		console.log( req.body );
		var fields = req.body.fields;
		this.sendRequest({
			url: this.redmineUrl + "/issues.json",
			method: "POST",
			json: {
				issue: {
					project_id: fields.project.key,
					priority_id: 7,
					subject: fields.summary,
					description: fields.description + "\n\n<pre>" + fields.description + "</pre>"
				}
			}
		}, req.session, function( err, response, body ){
			if( !body ){
				return res.send(503);
			}
			if( response.statusCode === 201 ){
				var baseUrl = this.baseUrl || ( req.protocol + ( req.headers["x-forwarded-host"] ||req.headers.host ) );
				var issue = {
					id: body.issue.id.toString(),
					key: body.issue.id.toString(),
					self: baseUrl + "/jira/rest/api/" + req.param( "jiraVersion" ) + "/issue/" + body.issue.id
				};
				res.json( 201, issue );
			}
			else{
				res.send( response.statusCode );
			}
		});
	},

	remoteLink: function( req, res ){
		console.log( req.body );
		res.send(500);
	},
	
	showIssue: function( req, res ){
		res.redirect( this.redmineUrl + "/issues/" + req.param( "issueId" ) );
	}
};
/*
{
	"issue": {
		"updated_on": "2013/01/26 14:35:05 +0000",
		"priority": {
			"name": "Immediate",
			"id": 7
		},
		"project": {
			"name": "elviraapi",
			"id": 8
		},
		"description": "Error: Memory allocation failed : growing buffer\r\n\r\n ",
		"status": {
			"name": "New",
			"id": 1
		},
		"spent_hours": 0,
		"done_ratio": 0,
		"start_date": "2013/01/26",
		"author": {
			"name": "Róbert Oroszi",
			"id": 6
		},
		"created_on": "2013/01/26 14:35:05 +0000",
		"tracker": {
			"name": "Feature",
			"id": 2
		},
		"id": 989,
		"subject": "Error: Memory allocation failed : growing buffer "
	}
}
-------
{
			"id": "10000",
			"key": "TST-24",
			"self": "http://www.example.com/jira/rest/api/2/issue/10000"
	}
*/
module.exports = Redmine;