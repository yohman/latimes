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
var owl = $("#photo-container");
owl.owlCarousel({
	items : 10, //10 items above 1000px browser width
	itemsDesktop : [1000,5], //5 items between 1000px and 901px
	itemsDesktopSmall : [900,3], // betweem 900px and 601px
	itemsTablet: [600,2], //2 items between 600 and 0
	itemsMobile : false, // itemsMobile disabled - inherit from itemsTablet option
	navigation : true,
	paginationNumbers: true
});

var modal = new Foundation.Reveal($('#modal'));

// Run on page load
$( document ).ready(function() {
	latimes.initialize();
    $(document).foundation();
});

latimes.initialize = function()
{
	latimes.map = L.map('map').setView([34.0697, -118.2286], 10);
	L.esri.basemapLayer('Imagery').addTo(latimes.map);
	L.esri.basemapLayer('ImageryLabels').addTo(latimes.map);
	latimes.createTimebar();

}

latimes.searchObjects = function()
{
	// remove existing markers
	if(latimes.markers)
	{
		latimes.map.removeLayer(latimes.markers);
		latimes.markers.clearLayers();
	}

	$('#photo-container').html('');
	// owl = $("#photo-container");

	$('#timebar').empty();

	latimes.timebaritems.length = 0;

	var searchterm = $('#search-text').val();

	var url = latimes.apiurl+searchterm;
	var encodedurl = encodeURIComponent(url);

	var proxyurl = latimes.proxyurl+encodedurl;

	$.getJSON(proxyurl,function(data){

		$('#results-title').html('Found '+data.result.records.length+' photos:');
		$.each(data.result.records,function(i,val){
			var longitude = val['Description.longitude'];
			var latitude = val['Description.latitude'];
			var start = val['Date.cleaned'];
			var imageurl = val['imageurl'];
			var imagehtml = '<img src="'+imageurl+'" class="thumbnail" width="">';
			var imagefullhtml = '<img src="'+imageurl+'">';
			var mapme = true;

			var error = '';
			if(longitude == ''){ mapme = false; error = 'longitude is empy; '}
			if(latitude == ''){ mapme = false; error = 'latitude is empy; ' }
			if(start == ''){ mapme = false; error = 'start is empy; ' }
			if(start == null){ mapme = false; error = 'start is null; ' }

			if(isNaN(longitude)){ mapme = false;  error = 'longitude is NaN; ' }
			if(isNaN(latitude)){ mapme = false;  error = 'latitude is NaN; ' }
			if(mapme)
			{

				var icon = L.icon({
					iconUrl: imageurl,
					iconSize:     [25, 25], // size of the icon
				});

				var markerdata = 
				{
					id: i,
					name: val.Title,
					lat: latitude,
					lng: longitude,
					start: start,
					// type: 'point',
					imageurl: imageurl,
					// content: val.Title.substring(0,10)+'...'
					tooltip: imagehtml,
					icon:   icon,
					type: 'point'
				}
				// add the data to the timebar items array
				latimes.timebaritems.push(markerdata);

				// $('#photo-container').append('<div class="item" onclick="" >'+imagehtml+'<br>'+val.Title+'</div>')
				var content = '<div class="item" onclick="latimes.popup('+i+')" >'+imagehtml+'</div>';
				owl.data('owlCarousel').addItem(content);
  
				var marker = L.marker([val['Description.latitude'],val['Description.longitude']]).bindPopup(val.Title+'<br>'+imagefullhtml);
				latimes.markers.addLayer(marker);
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

	latimes.timeline.on('select', function (properties) {
      	id = properties.items[0];
      	latimes.popup(id);
    });

}

latimes.popup = function(id)
{
  	var thisitem = latimes.timebaritems[id];
	$('#modal-content').html(thisitem.tooltip);
	$('#modal-caption').html(thisitem.name);
	modal.open();

}
