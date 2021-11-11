var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var path = require('path');
var qs = require('querystring');
var express = require('express');
var sqlite3 = require('sqlite3');
// npm install 

var port = process.env.PORT || 80; // Required for Heroku

var app = express();

app.use(express.json());

var baseDirectory = __dirname;
var db = new sqlite3.Database(baseDirectory + '/dfcx_airlines.db', sqlite3.OPEN_READWRITE, (err) => {
	if (err) {
		return console.error(err.message);
	}
	console.log('Connected to the sqlite database.');
});

// TODO: Calculate refundable amount based on date, and add the refund parameter as a response when asking to cancel or change flight

function getUser(userID) {
	return new Promise(resolve => {
		db.get("SELECT * FROM User WHERE userID = ?", [userID], (err, row) => {
			if (err) {
				console.error(err.message);
				resolve(null);
			}
			if (row) {
				// User exists
				console.log("Found user");
				console.log(row);
				resolve(row);
			}
			else {
				console.log("No user with this ID");
				resolve(null);
			}
		});
	});
}

function getBookedFlightIncludingCanceled(userID) {
	return new Promise(resolve => {
		db.all("SELECT b.bookingID AS bookingID, b.userID AS userID, b.flightID AS flightID, b.returnFlightID AS returnFlightID, b.price AS totalPrice, b.canceled AS canceled, f1.startLocation AS startFlightStartLocation, f1.endLocation AS startFlightEndLocation, f1.date as startFlightDate, f1.departure AS startFlightDeparture, f1.arrival AS startFlightArrival, f1.price AS startFlightPrice, f2.endLocation AS endFlightEndLocation, f2.date as endFlightDate, f2.departure AS endFlightDeparture, f2.arrival AS endFlightArrival, f2.price AS endFlightPrice FROM BookedFlight b JOIN Flight f1 ON b.flightID = f1.flightID LEFT JOIN Flight f2 ON b.returnFlightID = f2.flightID WHERE b.userID = ?", [userID], (err, rows) => {
			if (err) {
				console.error(err.message);
				resolve(null);
			}
			if (rows && rows.length > 0) {
				// User has booked flights, return them
				console.log("Found "+rows.length+" booked flights for user");
				resolve(rows);
			}
			else {
				console.log("User has no booked flights");
				resolve(null);
			}
		});
	});
}

function getBookedFlights(userID) {
	return new Promise(resolve => {
		db.all("SELECT b.bookingID AS bookingID, b.userID AS userID, b.flightID AS flightID, b.returnFlightID AS returnFlightID, b.price AS totalPrice, b.canceled AS canceled, f1.startLocation AS startFlightStartLocation, f1.endLocation AS startFlightEndLocation, f1.date as startFlightDate, f1.departure AS startFlightDeparture, f1.arrival AS startFlightArrival, f1.price AS startFlightPrice, f2.endLocation AS endFlightEndLocation, f2.date as endFlightDate, f2.departure AS endFlightDeparture, f2.arrival AS endFlightArrival, f2.price AS endFlightPrice FROM BookedFlight b JOIN Flight f1 ON b.flightID = f1.flightID LEFT JOIN Flight f2 ON b.returnFlightID = f2.flightID WHERE b.userID = ? AND b.canceled = 0", [userID], (err, rows) => {
			if (err) {
				console.error(err.message);
				resolve(null);
			}
			if (rows && rows.length > 0) {
				// User has booked flights, return them
				console.log("Found "+rows.length+" booked flights for user");
				resolve(rows);
			}
			else {
				console.log("User has no booked flights");
				resolve(null);
			}
		});
	});
}

function getCanceledFlights(userID) {
	return new Promise(resolve => {
		db.all("SELECT b.bookingID AS bookingID, b.userID AS userID, b.flightID AS flightID, b.returnFlightID AS returnFlightID, b.price AS totalPrice, b.canceled AS canceled, f1.startLocation AS startFlightStartLocation, f1.endLocation AS startFlightEndLocation, f1.date as startFlightDate, f1.departure AS startFlightDeparture, f1.arrival AS startFlightArrival, f1.price AS startFlightPrice, f2.endLocation AS endFlightEndLocation, f2.date as endFlightDate, f2.departure AS endFlightDeparture, f2.arrival AS endFlightArrival, f2.price AS endFlightPrice FROM BookedFlight b JOIN Flight f1 ON b.flightID = f1.flightID LEFT JOIN Flight f2 ON b.returnFlightID = f2.flightID WHERE b.userID = ? AND b.canceled = 1", [userID], (err, rows) => {
			if (err) {
				console.error(err.message);
				resolve(null);
			}
			if (rows && rows.length > 0) {
				// User has booked flights, return them
				console.log("Found "+rows.length+" booked flights for user");
				resolve(rows);
			}
			else {
				console.log("User has no booked flights");
				resolve(null);
			}
		});
	});
}

function getBookedFlightByID(userID, bookingID) {
	return new Promise(resolve => {
		db.get("SELECT b.bookingID AS bookingID, b.userID AS userID, b.flightID AS flightID, b.returnFlightID AS returnFlightID, b.price AS totalPrice, f1.startLocation AS startFlightStartLocation, f1.endLocation AS startFlightEndLocation, f1.date as startFlightDate, f1.departure AS startFlightDeparture, f1.arrival AS startFlightArrival, f1.price AS startFlightPrice, f2.endLocation AS endFlightEndLocation, f2.date as endFlightDate, f2.departure AS endFlightDeparture, f2.arrival AS endFlightArrival, f2.price AS endFlightPrice FROM BookedFlight b JOIN Flight f1 ON b.flightID = f1.flightID LEFT JOIN Flight f2 ON b.returnFlightID = f2.flightID WHERE b.userID = ? AND b.bookingID = ?", [userID, bookingID], (err, row) => {
			if (err) {
				console.error(err.message);
				resolve(null);
			}
			if (row) {
				// User has booked flight, return it
				console.log("Found booked flight by ID");
				resolve(row);
			}
			else {
				console.log("User has no booked flight with this booking ID");
				resolve(null);
			}
		});
	});
}

function getFlightByID(flightID) {
	return new Promise(resolve => {
		db.get("SELECT * FROM Flight WHERE flightID = ?", [flightID], (err, row) => {
			if (err) {
				console.error(err.message);
				resolve(null);
			}
			if (row) {
				// Found flight
				console.log("Found flight from ID");
				resolve(row);
			}
			else {
				console.log("No flight with this ID");
				resolve(null);
			}
		});
	});
}

function getFlightsOneWay(startLocation, endLocation, date) {
	return new Promise(resolve => {
		db.all("SELECT * FROM Flight WHERE startLocation = ? AND endLocation = ? AND date = ?", [startLocation, endLocation, date], (err, rows) => {
			if (err) {
				console.error(err.message);
				resolve(null);
			}
			if (rows && rows.length > 0) {
				// Found flights
				console.log("Found "+rows.length+" compatible flights");
				resolve(rows);
			}
			else {
				console.log("No flights matching these parameters");
				resolve(null);
			}
		});
	});
}

function getFlightsRoundTrip(startLocation, endLocation, startDate, endDate) {
	return new Promise(resolve => {
		db.all("SELECT * FROM Flight WHERE startLocation = ? AND endLocation = ? AND date = ?", [startLocation, endLocation, startDate], (err, rows) => {
			if (err) {
				console.error(err.message);
				resolve(null);
			}
			if (rows && rows.length > 0) {
				// Found flights, now search for return flights
				db.all("SELECT * FROM Flight WHERE startLocation = ? AND endLocation = ? AND date = ?", [endLocation, startLocation, endDate], (err2, rows2) => {
					if (err2) {
						console.error(err2.message);
						resolve(null);
					}
					if (rows2 && rows2.length > 0) {
						// Found return flights, give both flights back
						console.log("Found ("+rows.length+", "+rows2.length+") compatible flights");
						resolve([rows, rows2]);
					}
					else {
						console.log("No return flights found matching these parameters");
						resolve(null);
					}
				});
			}
			else {
				console.log("No flights matching these parameters");
				resolve(null);
			}
		});
	});
}

// get user info
app.post('/user_info', async function(req, res) {
	var params = req.body.sessionInfo.parameters;
	var userID = params.user_id;
	var user = await getUser(userID);
	console.log(user);
	if (user != null) {
		var webhookResponse =
		{
			"sessionInfo": {"parameters": {
				"user_name": user.name,
				"authenticated": true
			}},
			"payload": {}
		};
		res.writeHead(200);
		res.end(JSON.stringify(webhookResponse));
	}
	else {
		// User not found
		var webhookResponse =
		{
			"sessionInfo": {"parameters": {
				"error": "User not found"
			}},
			"payload": {}
		};
		res.writeHead(200);
		res.end(JSON.stringify(webhookResponse));
	}
	
});

app.post('/booked_flights', async function(req, res) {
	var params = req.body.sessionInfo.parameters;
	var userID = params.user_id;
	var user = await getUser(userID);
	if (user != null) {
		var bookedFlights = await getBookedFlights(userID);
		if (bookedFlights != null) {
			// User has booked flights, return the relevant data
			var webhookResponse =
			{
				"sessionInfo": {"parameters": {
					"user_name": user.name,
					"authenticated": true,
					"booked_flights": bookedFlights,
					"num_flights": bookedFlights.length
				}},
				"payload": {}
			};
			res.writeHead(200);
			res.end(JSON.stringify(webhookResponse));
		}
		else {
			// User has no booked flights, not an error though (?) or maybe webhook error
			var webhookResponse =
			{
				"sessionInfo": {"parameters": {
					"user_name": user.name,
					"authenticated": true,
					"booked_flights": [],
					"num_flights": 0
				}},
				"payload": {}
			};
			res.writeHead(200);
			res.end(JSON.stringify(webhookResponse));
		}
	}
	else {
		// User not found
		var webhookResponse =
		{
			"sessionInfo": {"parameters": {
				"error": "User not found"
			}},
			"payload": {}
		};
		res.writeHead(200);
		res.end(JSON.stringify(webhookResponse));
	}
});

// validate booking ID
app.post('/validate_booking_id', async function(req, res) {
	var params = req.body.sessionInfo.parameters;
	var userID = params.user_id;
	var bookingID = params.booking_id;
	var user = await getUser(userID);
	if (user != null) {
		var bookedFlight = await getBookedFlightByID(userID, bookingID);
		if (bookedFlight != null) {
			// User has booked flight, return the relevant data
			var webhookResponse =
			{
				"sessionInfo": {"parameters": {
					"user_name": user.name,
					"authenticated": true,
					"booking_id_valid": true,
					"booked_flights": [bookedFlight]
				}},
				"payload": {}
			};
			res.writeHead(200);
			res.end(JSON.stringify(webhookResponse));
		}
		else {
			// User has no booked flights matching this booking ID
			var webhookResponse =
			{
				"sessionInfo": {"parameters": {
					"user_name": user.name,
					"authenticated": true,
					"error": "User has no flights with this booking ID"
				}},
				"payload": {}
			};
			res.writeHead(200);
			res.end(JSON.stringify(webhookResponse));
		}
	}
	else {
		// User not found
		var webhookResponse =
		{
			"sessionInfo": {"parameters": {
				"error": "User not found"
			}},
			"payload": {}
		};
		res.writeHead(200);
		res.end(JSON.stringify(webhookResponse));
	}
});

// cancel flight
app.post('/cancel_flight', async function(req, res) {
	var params = req.body.sessionInfo.parameters;
	var userID = params.user_id;
	var bookingID = params.booking_id;
	var user = await getUser(userID);
	if (user != null) {
		var bookedFlight = await getBookedFlightByID(userID, bookingID);
		if (bookedFlight != null) {
			// User has booked flight, cancel it
			
			db.run("UPDATE BookedFlight SET canceled = 1 WHERE userID = ? AND bookingID = ?", [userID, bookingID], (err) => {
				if (err) {
					// Error canceling flight
					var webhookResponse =
					{
						"sessionInfo": {"parameters": {
							"user_name": user.name,
							"authenticated": true,
							"error": "Cancel flight failure: "+err
						}},
						"payload": {}
					};
					res.writeHead(200);
					res.end(JSON.stringify(webhookResponse));
				}
				else {
					// Flight canceled successfully, set refund amount
					var webhookResponse =
					{
						"sessionInfo": {"parameters": {
							"user_name": user.name,
							"authenticated": true,
							"success": true
							
							
							
							
							
						}},
						"payload": {}
					};
					res.writeHead(200);
					res.end(JSON.stringify(webhookResponse));
				}
			});
		}
		else {
			// User has no booked flights matching this booking ID
			var webhookResponse =
			{
				"sessionInfo": {"parameters": {
					"user_name": user.name,
					"authenticated": true,
					"error": "User has no flights with this booking ID"
				}},
				"payload": {}
			};
			res.writeHead(200);
			res.end(JSON.stringify(webhookResponse));
		}
	}
	else {
		// User not found
		var webhookResponse =
		{
			"sessionInfo": {"parameters": {
				"error": "User not found"
			}},
			"payload": {}
		};
		res.writeHead(200);
		res.end(JSON.stringify(webhookResponse));
	}
});

// query flights
app.post('/query_flights', async function(req, res) {
	var params = req.body.sessionInfo.parameters;
	var startLocation = params.startLocation;
	var endLocation = params.endLocation;
	var startDate = params.startDate;
	if (params.endDate != null) {
		// Round trip
		var endDate = params.endDate;
		var flights = await getFlightsRoundTrip(startLocation, endLocation, startDate, endDate);
		if (flights != null) {
			// Found flights
			var webhookResponse =
			{
				"sessionInfo": {"parameters": {
					"flights": flights
					
					
					
					
					
				}},
				"payload": {}
			};
			res.writeHead(200);
			res.end(JSON.stringify(webhookResponse));
		}
		else {
			// No flights found
			var webhookResponse =
			{
				"sessionInfo": {"parameters": {
					"error": "No flights found"
				}},
				"payload": {}
			};
			res.writeHead(200);
			res.end(JSON.stringify(webhookResponse));
		}
	}
	else {
		// One way
		var flights = await getFlightsOneWay(startLocation, endLocation, startDate);
		if (flights != null) {
			// Found flights
			var webhookResponse =
			{
				"sessionInfo": {"parameters": {
					"flights": flights
					
					
					
					
					
					
				}},
				"payload": {}
			};
			res.writeHead(200);
			res.end(JSON.stringify(webhookResponse));
		}
		else {
			// No flights found
			var webhookResponse =
			{
				"sessionInfo": {"parameters": {
					"error": "No flights found"
				}},
				"payload": {}
			};
			res.writeHead(200);
			res.end(JSON.stringify(webhookResponse));
		}
	}
});

// book flights
app.post('/book_flights', async function(req, res) {
	var params = req.body.sessionInfo.parameters;
	var userID = params.user_id;
	var user = await getUser(userID);
	if (user != null) {
		var flightID = params.flight_id;
		var flight = await getFlightByID(flightID);
		if (flight != null) {
			// Flight found
			if (params.returnFlightID != null) {
				// Round trip
				var returnFlightID = params.return_flight.id;
				var returnFlight = await getFlightByID(returnFlightID);
				if (returnFlight != null) {
					// Book both flights
					var totalPrice = flight.price + returnFlight.price;
					db.run("INSERT INTO BookedFlight(userID, flightID, returnFlightID, price) VALUES(?, ?, ?, ?)", [userID, flightID, returnFlightID, totalPrice], function(err) {
					if (err) {
						// Error booking flight
						var webhookResponse =
						{
							"sessionInfo": {"parameters": {
								"user_name": user.name,
								"authenticated": true,
								"error": "Flight booking failure: "+err
							}},
							"payload": {}
						};
						res.writeHead(200);
						res.end(JSON.stringify(webhookResponse));
					}
					else {
						// Booking successful, return bookingID
						//this.lastID;
						var webhookResponse =
						{
							"sessionInfo": {"parameters": {
								"user_name": user.name,
								"authenticated": true,
								"success": true,
								"booking_id": this.lastID
							}},
							"payload": {}
						};
						res.writeHead(200);
						res.end(JSON.stringify(webhookResponse));
					}
				});
				}
				else {
					// Return flight not found
					var webhookResponse =
					{
						"sessionInfo": {"parameters": {
							"user_name": user.name,
							"authenticated": true,
							"error": "Flight not found"
						}},
						"payload": {}
					};
					res.writeHead(200);
					res.end(JSON.stringify(webhookResponse));
				}
			}
			else {
				// One way
				// Book flight
				db.run("INSERT INTO BookedFlight(userID, flightID, price) VALUES(?, ?, ?)", [userID, flightID, flight.price], function(err) {
					if (err) {
						// Error booking flight
						var webhookResponse =
						{
							"sessionInfo": {"parameters": {
								"user_name": user.name,
								"authenticated": true,
								"error": "Flight booking failure: "+err
							}},
							"payload": {}
						};
						res.writeHead(200);
						res.end(JSON.stringify(webhookResponse));
					}
					else {
						// Booking successful, return bookingID
						//this.lastID;
						var webhookResponse =
						{
							"sessionInfo": {"parameters": {
								"user_name": user.name,
								"authenticated": true,
								"success": true,
								"booking_id": this.lastID
							}},
							"payload": {}
						};
						res.writeHead(200);
						res.end(JSON.stringify(webhookResponse));
					}
				});
			}
		}
		else {
			// Flight not found
			var webhookResponse =
			{
				"sessionInfo": {"parameters": {
					"user_name": user.name,
					"authenticated": true,
					"error": "Flight not found"
				}},
				"payload": {}
			};
			res.writeHead(200);
			res.end(JSON.stringify(webhookResponse));
		}
	}
	else {
		// User not found
		var webhookResponse =
		{
			"sessionInfo": {"parameters": {
				"error": "User not found"
			}},
			"payload": {}
		};
		res.writeHead(200);
		res.end(JSON.stringify(webhookResponse));
	}
});

app.post('/wake', async function(req, res) {
	/*
	db = new sqlite3.Database(baseDirectory + '/dfcx_airlines.db', sqlite3.OPEN_READWRITE, (err) => {
		if (err) {
			return console.error(err.message);
		}
		console.log('Connected to the sqlite database.');
		res.writeHead(200);
		res.end('ok');
	});
	*/
	res.writeHead(200);
	res.end('ok');
});

app.listen(port);
