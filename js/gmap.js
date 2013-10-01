// === Configuration ===

STARTUP_LAT = 33.8;
STARTUP_LON = -84.5;
STARTUP_ZOOM = 8;

// === Globals ===

Map=null;
Planes={};
NumPlanes = 0;
HiddenPlanes = 0;
Selected=null
intervalObj = null;
existing = {};			// store known flights, key = ICAO, value = table row

function getIconForPlane(plane) {
	var r = 255, g = 255, b = 0;
	var maxalt = 40000; /* Max altitude in the average case */
	var invalt = maxalt-plane.altitude;
	var selected = (Selected == plane.hex);

	if (invalt < 0) invalt = 0;
	b = parseInt(255/maxalt*invalt);
	return {
		strokeWeight: (selected ? 2 : 1),
		path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
		scale: 5,
		fillColor: 'rgb('+r+','+g+','+b+')',
		fillOpacity: 0.9,
		rotation: plane.track
	};
}

function selectPlane() {
	if (!Planes[this.planehex]) return;
	var old = Selected;
	Selected = this.planehex;
	if (Planes[old]) {
		/* Remove the highlight in the previously selected plane. */
		Planes[old].marker.setIcon(getIconForPlane(Planes[old]));
	}
	Planes[Selected].marker.setIcon(getIconForPlane(Planes[Selected]));
	refreshSelectedInfo();
}

function refreshGeneralInfo() {
	var newHTML = NumPlanes+' planes on screen.';
	if (HiddenPlanes)
		newHTML += '<br/>' + HiddenPlanes + ' not shown (no positional data).';
	
	var i = document.getElementById('geninfo');
	i.innerHTML = newHTML;
}

function refreshSelectedInfo() {
	var i = document.getElementById('selinfo');
	var p = Planes[Selected];

	if (!p) return;
	var html = 'ICAO: '+p.hex+'<br>';
	if (p.flight.length) {
		html += '<b>'+p.flight+'</b><br>';
	}
	html += 'Altitude: '+p.altitude+' feet<br>';
	html += 'Speed: '+p.speed+' knots<br>';
	html += 'Coordinates: '+p.lat+', '+p.lon+'<br>';
	html += '<a href="#" onclick="return moveToLocation(' + p.lat + ',' + p.lon + ');">Jump to location</a>';
	i.innerHTML = html;
}

function moveToLocation(lat, lng){
	var center = new google.maps.LatLng(lat, lng);
	// using global variable:
	Map.panTo(center);
	return false;
}

function fetchData() {
	$.getJSON(DATA_HREF, function(data) {
		var stillhere = {}
		NumPlanes = 0
		HiddenPlanes = 0
		var found = [];
		for (var j=0; j < data.length; j++) {
			var plane = data[j];
			var visible = (plane.lat != 0 || plane.lon != 0);
			
			// Update the table
			var tr;
			if (plane.hex in existing) {
				tr = existing[plane.hex];
			} else {
				tr = addRow(plane.hex);
			}

			tr.children("td").each(function(j) {
				if (j == 0) {
					var html = plane.hex;
					if (visible)
						html = '<a href="#" onclick="return moveToLocation(' + plane.lat + ',' + plane.lon + ');">' + html + '</a>';
					$(this).html(html);
				} else if (j == 1) {
					$(this).text(plane.flight);
				}
			} );

			found.push(plane.hex);

			// Only proceed if not hidden
			if (!visible) {
				HiddenPlanes++;
				continue;
			}
			
			NumPlanes++;
			var marker = null;
			stillhere[plane.hex] = true;
			plane.flight = $.trim(plane.flight);

			if (Planes[plane.hex]) {
				var myplane = Planes[plane.hex];
				marker = myplane.marker;
				var icon = marker.getIcon();
				var newpos = new google.maps.LatLng(plane.lat, plane.lon);
				marker.setPosition(newpos);
				marker.setIcon(getIconForPlane(plane));
				myplane.altitude = plane.altitude;
				myplane.speed = plane.speed;
				myplane.lat = plane.lat;
				myplane.lon = plane.lon;
				myplane.track = plane.track;
				myplane.flight = plane.flight;
				if (myplane.hex == Selected)
					refreshSelectedInfo();
			} else {
				marker = new google.maps.Marker({
					position: new google.maps.LatLng(plane.lat, plane.lon),
					map: Map,
					icon: getIconForPlane(plane)
				});
				plane.marker = marker;
				marker.planehex = plane.hex;
				Planes[plane.hex] = plane;

				/* Trap clicks for this marker. */
				google.maps.event.addListener(marker, 'click', selectPlane);
			}
			if (plane.flight.length == 0)
				marker.setTitle(plane.hex)
			else
				marker.setTitle(plane.flight+' ('+plane.hex+')')
		}


		// Remove the stuff that no longer exists in the json
		for (var key in existing) {
			if (existing.hasOwnProperty(key) && ($.inArray(key, found) == -1)) {
				existing[key].remove();
				delete existing[key];
			}
		}

		// Remove idle planes from the map
		for (var p in Planes) {
			if (!stillhere[p]) {
				Planes[p].marker.setMap(null);
				delete Planes[p];
			}
		}
	});
}

function addRow(icao) {
	var newHTML = "<tr><td></td><td></td></tr>";
	var element = $(newHTML);
	$("#flightlist > tbody").append(element);
	existing[icao] = element;
	return element;
}

$(document).ready(function() {
	var mapOptions = {
		center: new google.maps.LatLng(STARTUP_LAT, STARTUP_LON),
		zoom: STARTUP_ZOOM,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	Map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

	// Setup our timer to poll from the server.
	intervalObj = setInterval(function() {
		fetchData();
		refreshGeneralInfo();
	}, 2000);
} );


