var latimes = {
	// apiurl: 		'http://gis.ucla.edu/geodata/api/action/datastore_search?resource_id=bc49908d-42c8-4a11-b115-531719d20928&limit=1000&q=',
	apiurl: 		'http://gis.ucla.edu/geodata/api/action/datastore_search?resource_id=3d044e87-db2b-4121-860c-d7f55d8e3547&limit=5000&q=',

	proxyurl: 		'http://sandbox.idre.ucla.edu/proxy/proxy.php?url=',
	map: 			'',
	mapdata: 		'',
	bounds: 		L.latLngBounds([]),
	markers: 		new L.FeatureGroup(),
	timebaritems: 	[],
}


// Run on page load
$( document ).ready(function() {
	latimes.initialize();
});

latimes.initialize = function()
{
	latimes.map = L.map('map').setView([34.0697, -118.2286], 10);
	L.esri.basemapLayer('Streets').addTo(latimes.map);
}

latimes.searchObjects = function()
{
	// remove existing markers
	if(latimes.markers)
	{
		latimes.map.removeLayer(latimes.markers);
		latimes.markers.clearLayers();
	}

	$('#thumb-container').empty();
	$('#timebar').empty();

	latimes.timebaritems.length = 0;

	var searchterm = $('#search-text').val();

	var url = latimes.apiurl+searchterm;
	var encodedurl = encodeURIComponent(url);

	var proxyurl = latimes.proxyurl+encodedurl;

	$.getJSON(proxyurl,function(data){
		console.log(data);
		// mapdata = data.features;
		$('#results-title').html('Found '+data.result.records.length+' photos:');
		$.each(data.result.records,function(i,val){
			var longitude = val['Description.longitude'];
			var latitude = val['Description.latitude'];
			var start = val['Date.cleaned'];
			var imageurl = val['imageurl'];
			var imagehtml = '<img src="'+imageurl+'" width="35">';
			var imagefullhtml = '<img src="'+imageurl+'">';
			var mapme = true;

			console.log(start)
			var error = '';
			if(longitude == ''){ mapme = false; error = 'longitude is empy; '}
			if(latitude == ''){ mapme = false; error = 'latitude is empy; ' }
			if(start == ''){ mapme = false; error = 'start is empy; ' }
			if(start == null){ mapme = false; error = 'start is null; ' }

			if(isNaN(longitude)){ mapme = false;  error = 'longitude is NaN; ' }
			if(isNaN(latitude)){ mapme = false;  error = 'latitude is NaN; ' }
			// if(isNaN(start)){ mapme = false;  error = 'start is NaN; ' }

			// if(isNaN(start)){ mapme = false; }
			console.log(latitude)
			if(mapme)
			{
				console.log('in mapme')

				var icon = L.icon({
					iconUrl: imageurl,
					iconSize:     [25, 25], // size of the icon
				});

				var markerdata = 
				{
					name: val.Title,
					lat: latitude,
					lng: longitude,
					start: start,
					// type: 'point',
					imageurl: imageurl,
					// content: val.Title.substring(0,10)+'...'
					content: imagehtml,
					icon:   icon
				}
				console.log(markerdata)
				// add the data to the timebar items array
				latimes.timebaritems.push(markerdata);

				$('#thumb-container').append('<div class="thumb-box well" onclick="" >lat:'+val.Title+'<br>'+val['Date.creation']+'</div>')

				var marker = L.marker([val['Description.latitude'],val['Description.longitude']],{icon:icon}).bindPopup(val.Title+'<br>'+imagefullhtml);
				latimes.markers.addLayer(marker);
			}
			else
			{
				console.log('mapme must be false')
				console.log(error)
			}
		})

		latimes.map.addLayer(latimes.markers);
		latimes.map.fitBounds(latimes.markers.getBounds());

		// now that the loop has completed, create the timebar
		latimes.createTimebar();
	})

}

/*******************

	Create timebar

********************/
latimes.createTimebar = function()
{
	var timebarcontainer = document.getElementById('timebar');

	// Create a DataSet (allows two way data-binding)
	visitems = new vis.DataSet(latimes.timebaritems);

	// Configuration for the Timeline
	var options = {
		height: '100%',
		margin: {
			item: 0
		},
		orientation: 'top',
	};

	// Create a Timeline
	latimes.timeline = new vis.Timeline(timebarcontainer, visitems, options);

}
