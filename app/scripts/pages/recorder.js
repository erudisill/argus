var record_time = Date.now();

var recorder = {

	TRUCK_AWAY 		: 0,
	TRUCK_MOVING 	: 1,
	TRUCK_LOADING 	: 2,

	httpGet : function(url){
	    var request = new XMLHttpRequest();
	    request.open("GET", url, false);
	    request.send(null);
	    return request.responseText;
	},

	// Logs position records for all relevant trucks every 5 seconds 
	logTruckPositions : function(trucks){
		if(Date.now() - record_time > 5000){
			for (var i = 0; i < trucks.length; i++) {
				var truck = trucks[i];
				if (truck.status !== this.TRUCK_AWAY) {
					try{
						this.httpGet("http://localhost:5000/log/position/" + truck.id + "/" + truck.model.position.x + "/" + truck.model.position.y + "/" + truck.model.position.z);
					} catch(err){
						console.log(err.message);
					}
				}
			}
			record_time = Date.now();
		}
	},

	// Creates a new session record that corresponds to many position records
	initRecorder : function(){
		this.httpGet("http://localhost:5000/create/session")
	}
};