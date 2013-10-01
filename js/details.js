intervalObj = null;
existing = {};			// store known flights, key = ICAO, value = table row

function update() {
	$.ajax({url: DATA_HREF, dataType: "json"}).done(function(result) {
		//$("#" + id).children(".pingresult").text(result);
		//$(".tablesorter").trigger("update");
		var added = 0;
		var updated = 0;
		var removed = 0;
		
		var found = [];
		for (var i = 0; i < result.length; i++) {
			var row = result[i];
			var tr;
			if (row.hex in existing) {
				tr = existing[row.hex];
				updated++;
			} else {
				tr = addRow(row.hex);
				added++;
			}
			
			tr.children("td").each(function(j) {
				if (j == 0) {
					$(this).text(row.hex);
				} else if (j == 1) {
					$(this).text(row.flight);
				} else if (j == 2) {
					$(this).text(row.altitude);
				} else if (j == 3) {
					$(this).text(row.speed);
				} else if (j == 4) {
					$(this).text(row.lat);
				} else if (j == 5) {
					$(this).text(row.lon);
				} else if (j == 6) {
					$(this).text(row.track);
				} else if (j == 7) {
					$(this).text(row.messages);
				} else if (j == 8) {
					$(this).text(row.seen);
				}
			} );
			
			found.push(row.hex);
		}
		
		// Remove the stuff that no longer exists in the json
		for (var key in existing) {
			if (existing.hasOwnProperty(key) && ($.inArray(key, found) == -1)) {
				existing[key].remove();
				delete existing[key];
				removed++;
			}
		}
		
		$("#flightlist").trigger("update");
		
		//$("#status").text("Last result: success");		// <br/>Added: " + added + "<br/>Updated: " + updated + "<br/>Removed: " + removed
	} ).fail(function() {
		//$("#status").text("Last result: fail");
	} );
}

function addRow(icao) {
	var newHTML = "<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>";
	var element = $(newHTML);
	$("#flightlist > tbody").append(element);
	existing[icao] = element;
	return element;
}

$(document).ready(function() {
	// Init tablesorter
	$(".tablesorter").tablesorter();

	update();
	intervalObj = setInterval(update, 1000);
} );
