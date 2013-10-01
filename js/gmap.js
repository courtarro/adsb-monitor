// === Configuration ===

STARTUP_LAT = 33.8;
STARTUP_LON = -84.5;
STARTUP_ZOOM = 9;

// === Globals ===

map = null;					// Google Maps object
planes = {};				// list of known planes (key = ICAO hex, value = plane object)
numPlanes = 0;				// number of active planes
visiblePlanes = 0;			// number of visible planes
selectedPlane = null;		// selected plane object, if any
intervalObj = null;			// object reference to store timer interval (in case we want to cancel)
planeTableRows = {};		// table row of known planes (key = ICAO hex, value = table row jQuery object)

function getIconForPlane(plane) {
	var r = 255, g = 255, b = 0;
	var maxalt = 40000; /* Max altitude in the average case */
	var invalt = maxalt-plane.altitude;
	var is_selected = (selectedPlane == plane);

	if (invalt < 0) invalt = 0;
	b = parseInt(255 / maxalt * invalt);
	return {
		strokeWeight: (is_selected ? 2 : 1),
		path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
		scale: 5,
		fillColor: 'rgb(' + r + ',' + g + ',' + b + ')',
		fillOpacity: 0.9,
		rotation: plane.track
	};
}

function refreshGeneralInfo() {
	var newHTML = numPlanes+' plane(s) tracked';
	newHTML += '<br/>' + visiblePlanes + ' shown on map';
	
	$("#geninfo").html(newHTML);
}

function refreshSelectedInfo() {
	if (!selectedPlane)
		return;

	var p = selectedPlane;		// easier to type, read

	var html = 'ICAO: ' + p.hex + '<br/>';
	if (p.flight.length)
		html += '<b>' + p.flight + '</b><br/>';
	if (p.altitude)
		html += 'Altitude: ' + p.altitude + ' feet<br/>';
	if (p.speed)
		html += 'Speed: ' + p.speed + ' knots<br/>';
	if (p.visible) {
		html += 'Coordinates: ' + p.lat + ', ' + p.lon + '<br/>';
		html += '<a href="#" onclick="return moveToLocation(' + p.lat + ',' + p.lon + ');">Jump to location</a>';
	}

	$("#selinfo").html(html);
}

function moveToLocation(lat, lng){
	var center = new google.maps.LatLng(lat, lng);
	// using global variable:
	map.panTo(center);
	return false;
}

function addRow(icao) {
	var newHTML = "<tr><td></td><td></td></tr>";
	var element = $(newHTML);
	$("#flightlist > tbody").append(element);
	planeTableRows[icao] = element;
	return element;
}

function planeTable_click(planeHex) {
	var plane = planes[planeHex];
	selectPlane(plane);
	if (plane.visible)
		moveToLocation(plane.lat, plane.lon);
	return false;
}

function selectPlane(plane) {
	var oldSelected = selectedPlane;

	selectedPlane = plane;

	if (oldSelected && oldSelected.marker)
		oldSelected.marker.setIcon(getIconForPlane(oldSelected));		// remove the highlight in the previously selected plane
	if (selectedPlane.marker)
		selectedPlane.marker.setIcon(getIconForPlane(selectedPlane));

	refreshSelectedInfo();
}

function update() {
	$.ajax({url: DATA_HREF, dataType: "json"}).done(function(data) {
		numPlanes = visiblePlanes = 0;
		var found = {};

		for (var j = 0; j < data.length; j++) {
			var plane = data[j];

			found[plane.hex] = true;

			plane.visible = (plane.lat != 0 || plane.lon != 0);
			plane.flight = $.trim(plane.flight);
			
			// Update the table
			var tr;
			if (plane.hex in planeTableRows) {
				tr = planeTableRows[plane.hex];
			} else {
				tr = addRow(plane.hex);
			}

			tr.children("td").each(function(j) {
				if (j == 0) {
					var html = '<a href="#" onclick="return planeTable_click(\'' + plane.hex + '\');">' + plane.hex + '</a>';
					$(this).html(html);
				} else if (j == 1) {
					$(this).text(plane.flight);
				}
			} );

			// Update the existing plane object with details from the new one, if possible
			if (planes[plane.hex]) {
				var oldPlane = planes[plane.hex];
				oldPlane.altitude = plane.altitude;
				oldPlane.speed = plane.speed;
				oldPlane.lat = plane.lat;
				oldPlane.lon = plane.lon;
				oldPlane.track = plane.track;
				oldPlane.flight = plane.flight;
				plane = oldPlane;
			} else {
				plane.marker = null;
				planes[plane.hex] = plane;		// save the new plane
			}

			// Update the map
			if (plane.visible) {
				if (plane.marker) {
					var icon = plane.marker.getIcon();
					var newpos = new google.maps.LatLng(plane.lat, plane.lon);
					plane.marker.setPosition(newpos);
					plane.marker.setIcon(getIconForPlane(plane));
				} else {
					var marker = new google.maps.Marker({
						position: new google.maps.LatLng(plane.lat, plane.lon),
						map: map,
						icon: getIconForPlane(plane)
					});
					plane.marker = marker;
					plane.marker.plane = plane;
					planes[plane.hex] = plane;

					// Trap clicks for this marker
					google.maps.event.addListener(plane.marker, 'click', function () { selectPlane(this.plane); } );
				}

				if (plane.flight.length == 0)
					plane.marker.setTitle(plane.hex)
				else
					plane.marker.setTitle(plane.flight + ' (' + plane.hex + ')')

				if (plane == selectedPlane)
					refreshSelectedInfo();

				visiblePlanes++;
			}

			numPlanes++;
		}


		// Remove the stuff that no longer exists in the json
		for (var key in planeTableRows) {
			if (!found[key]) {
				planeTableRows[key].remove();
				delete planeTableRows[key];
			}
		}

		// Remove idle planes from the map
		for (var key in planes) {
			if (!found[key]) {
				var oldPlane = planes[key];
				if (oldPlane.marker) {
					planes[key].marker.setMap(null);
				}
				delete planes[key];
			}
		}

		refreshGeneralInfo();
	});
}

$(document).ready(function() {
	var mapOptions = {
		center: new google.maps.LatLng(STARTUP_LAT, STARTUP_LON),
		zoom: STARTUP_ZOOM,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

	// Setup our timer to poll from the server.
	update();
	intervalObj = setInterval(function() {
		update();
	}, 2000);
} );


