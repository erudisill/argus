'use strict';

var record_time = Date.now();
var RecordTick = 0;

// Class/Object structure for dynamic truck position log requests
function TruckLogRequest(t){
	this.truckRequest = new XMLHttpRequest();
	this.truck = t;
}

TruckLogRequest.prototype = {
	constructor : TruckLogRequest,

	start : function(){
		this.truckRequest.onreadystatechange = this.onComplete;
		var x = (this.truck.status != 0) ? this.truck.model.position.x : 'NULL';
		var y = (this.truck.status != 0) ? this.truck.model.position.y : 'NULL';
		var z = (this.truck.status != 0) ? this.truck.model.position.z : 'NULL';
		this.truckRequest.open('GET', 'http://localhost:5000/log/position/' + this.truck.id + '/' + RecordTick + '/' + this.truck.status + '/' + x + '/' + y + '/' + z, true);
		this.truckRequest.send();
	},

	onComplete : function(){
		console.log('LOG COMPLETE');
	}
};

var recorder = {

	TRUCK_AWAY 		: 0,
	TRUCK_MOVING 	: 1,
	TRUCK_LOADING 	: 2,

	// Creates a new session record that corresponds to many position records
	// Returns 1 for success and 0 for failure
	initRecorder : function(){
		var initRequest = new XMLHttpRequest();
		initRequest.onreadystatechange = function(){ /* PASS */ };
	    initRequest.open('GET', 'http://localhost:5000/create/session', true);
	    initRequest.send();
	    return initRequest.responseText;
	},

	// Logs position records for all relevant trucks every 1 seconds 
	logTruckPositions : function(trucks){
		if(Date.now() - record_time > 1000){
			RecordTick++;
			for (var i = 0; i < trucks.length; i++) {
				var truck = trucks[i];
				try{
					var truckLog = new TruckLogRequest(truck);
					truckLog.start();
				} catch(err){
					console.log(err.message);
				}
			}
			record_time = Date.now();
		}
	},

	// Returns a 3D array of logged positions that correlate with the session ID and a list of trucks
	// WARNING: IS NOT ASYNCHRONOUS (yet!)
	getAllTruckPositions : function(session_key, trucks){
		var allPos = [];
		for(var i = 0; i < trucks.length; i++){
			allPos.push(this.getTruckPositions(session_key, trucks[i].id));
		}
		return allPos;
	},

	// Returns a 2D array of logged positions that correlate with the session ID and truck ID
	// WARNING: IS NOT ASYNCHRONOUS (yet!)
	getTruckPositions : function(session_key, t_id){
		var syncRequest = new XMLHttpRequest();
		syncRequest.open('GET', 'http://localhost:5000/retrieve/positions/' + session_key + '/' + t_id, false);
		syncRequest.send();
		var pos = syncRequest.responseText.split('<br>');
		for(var i = 0; i < pos.length; i++){
  			pos[i] = pos[i].split(',\'');
		}
		return pos;
	},

	// Returns the number of ticks recorded for a specific session
	// WARNING: IS NOT ASYNCHRONOUS (yet!)
	getMaxTicks : function(session_key){
		var request = new XMLHttpRequest();
		request.open('GET', 'http://localhost:5000/retrieve/length/tick/' + session_key, false)
		request.send();
		console.log(request.responseText);
		return parseInt(request.responseText);
	}
};