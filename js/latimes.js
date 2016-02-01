var latimes = {
	// apiurl: 		'http://gis.ucla.edu/geodata/api/action/datastore_search?resource_id=bc49908d-42c8-4a11-b115-531719d20928&limit=1000&q=',
	// apiurl: 		'http://gis.ucla.edu/geodata/api/action/datastore_search?resource_id=3d044e87-db2b-4121-860c-d7f55d8e3547&limit=2000&q=',
	apiurl: 		'https://spreadsheets.google.com/feeds/list/1bTyt562Bd8tX3n4ZeSvceuWn8LzL10O1xBo_ppM6ZCs/o2babeb/public/values?alt=json',
	apisource:  	'google', // google, geoportal
	proxyurl: 		'http://sandbox.idre.ucla.edu/proxy/proxy.php?url=',
	map: 			'',
	mapdata: 		'',
	bounds: 		L.latLngBounds([]),
	markers: 		new L.FeatureGroup(),
	timebaritems: 	[],
	data:  			{},
}

// var owl = $("#photo-container");
// owl.owlCarousel({
// 	items : 10, //10 items above 1000px browser width
// 	itemsDesktop : [1000,5], //5 items between 1000px and 901px
// 	itemsDesktopSmall : [900,3], // betweem 900px and 601px
// 	itemsTablet: [600,2], //2 items between 600 and 0
// 	itemsMobile : false, // itemsMobile disabled - inherit from itemsTablet option
// 	navigation : true,
// 	paginationNumbers: true
// });
$('#photo-container').slick({
	infinite: true,
	slidesToShow: 10,
	slidesToScroll: 10
})

var modal = new Foundation.Reveal($('#modal'));
var objects;

// Run on page load
$( document ).ready(function() {
	latimes.initialize();
	$(document).foundation();
});

latimes.initialize = function()
{

	latimes.map = L.map('map').setView([34.0697, -118.2286], 10);
	var tonerlayer = new L.StamenTileLayer("toner");
	latimes.map.addLayer(tonerlayer);
	// L.esri.basemapLayer('Imagery').addTo(latimes.map);
	// L.esri.basemapLayer('ImageryLabels').addTo(latimes.map);
	latimes.createTimebar();

	Papa.parse('http://sandbox.idre.ucla.edu/web/latimes/data/latimes.csv', {
		download: true,
		header: true,
		complete: function(results) {
			latimes.data = results.data;
			// modal.close();

			// $('body').html('');
			// $.each(latimes.data,function(i,val){
			// 	var imageurl = val['imageurl'];
			// 	var imagefullhtml = '<img src="'+imageurl+'"><br>';
			// 	$('body').append(imagefullhtml)
			// })

		}
	});
}

latimes.clearMap = function()
{
	// remove existing markers
	if(latimes.markers)
	{
		latimes.map.removeLayer(latimes.markers);
		latimes.markers.clearLayers();
	}

	$('#photo-container').slick('unslick');
	$('#photo-container').empty();
	$('#photo-container').slick({
		infinite: true,
		slidesToShow: 10,
		slidesToScroll: 10
	})
	// owl = $("#photo-container");

}

latimes.searchObjects = function()
{

	latimes.clearMap();
	$('#timebar').empty();
	latimes.timebaritems.length = 0;

	var searchterm = $('#search-text').val();
	var data = searchFor(searchterm);

	// sort by year
	data.sort(function(a, b) {
		return parseFloat(a.year) - parseFloat(b.year);
	});

	$('#results-title').html('Found '+data.length+' photos:');
	$.each(data,function(i,val){
		var longitude = Number(val['lon']);
		var latitude = Number(val['lat']);
		var start = Number(val['year']);
		var imageurl = val['imageurl'];
		var imagelocalpath = "photos/"+imageurl.substr(imageurl.indexOf("jpegs/") + 6)

		var imagehtml = '<img src="'+imagelocalpath+'" class="thumbnail" width="">';
		var imagefullhtml = '<img src="'+imagelocalpath+'">';
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
				iconUrl: imagelocalpath,
				iconSize:     [25, 25], // size of the icon
			});

			var markerdata = 
			{
				id: i,
				name: val.Title,
				lat: latitude,
				lng: longitude,
				start: new Date(start,1,1),
				year: start,
				// type: 'point',
				imageurl: imagelocalpath,
				imagehtml: imagehtml,
				// content: val.Title.substring(0,10)+'...'
				tooltip: imagehtml,
				icon:   icon,
				type: 'point'
			}

			// add the data to the timebar items array
			latimes.timebaritems.push(markerdata);

			var content = '<div class="item" onclick="latimes.popup('+i+')" ><div class="year-in-box">'+start+'</div><div>'+imagehtml+'</div></div>';

			$('#photo-container').slick('slickAdd',content);

			var marker = L.marker([latitude,longitude]).bindPopup(val.Title+'<br>'+imagefullhtml);
			latimes.markers.addLayer(marker);
		}
		else
		{
			console.log(error)
		}
	})

	latimes.map.addLayer(latimes.markers);
	latimes.map.fitBounds(latimes.markers.getBounds());

	// now that the loop has completed, create the timebar
	latimes.createTimebar();

}

/*******************

	Filter Map

********************/
latimes.filterMapByTime = function()
{
	// clear map
	// latimes.map.removeLayer(latimes.markers);
	// latimes.markers.clearLayers();
	// $('#photo-container').html('');

	latimes.clearMap();

	$.each(latimes.timeline.getVisibleItems(),function(i,val){
		var thisitem = latimes.timebaritems[val]
		var content = '<div class="item" onclick="latimes.popup('+i+')" >'+thisitem.imagehtml+'</div>';
		$('#photo-container').slick('slickAdd',content);

		var marker = L.marker([thisitem.lat,thisitem.lng]).bindPopup(thisitem.name+'<br>');
		latimes.markers.addLayer(marker);

	});
	latimes.map.addLayer(latimes.markers);
	latimes.map.fitBounds(latimes.markers.getBounds());

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
		// orientation: 'top',
	};

	// Create a Timeline
	latimes.timeline = new vis.Timeline(timebarcontainer, visitems, options);

	latimes.timeline.on('select', function (properties) {
		id = properties.items[0];
		latimes.popup(id);
	});

	latimes.timeline.on('rangechanged', function (properties) {
		latimes.filterMapByTime();
	});

}

latimes.popup = function(id)
{

	modal.open();

	$('#modal').html('<div class="slick">');

	// get time bar items
	// var timebaritems = latimes.timeline.getVisibleItems();

	// sort by year
	latimes.timebaritems.sort(function(a, b) {
		return parseFloat(a.year) - parseFloat(b.year);
	});

	$.each(latimes.timebaritems,function(i,val){
		console.log(val)
		// var thisitem = latimes.timebaritems[val]
		// var content = '<div class="item">'+thisitem.imagehtml+'<br>'+thisitem.name+'</div>';
		var content = '<div style="padding:10px;"><h2>'+val.year+'</h2>'+val.imagehtml+'<span class="caption">'+val.name+'</span></div>';
		$('.slick').append(content);
	});
	// $('#modal').append('</div>')
	$('.slick').slick({
		// dots: true,
		infinite: false,
		speed: 300,
		slidesToShow: 1,
		centerMode: true,
		// variableWidth: true,
		// adaptiveHeight: true
	});
	modal.close();
	modal.open();
}

latimes.modal = function(message)
{
	modal.open();
	var modal_owl = $("#modal-photo-container");
	modal_owl.owlCarousel({
		singleItem:true,
		navigation : true,
	});
	$.each(latimes.timeline.getVisibleItems(),function(i,val){
		var thisitem = latimes.timebaritems[val]
		var content = '<div class="item">'+thisitem.imagehtml+'</div>';
		modal_owl.data('owlCarousel').addItem(content);
	});
	

	// $('#modal-content').html(message);
	// $('#modal-caption').html(thisitem.name);

}

function trimString(s) {
	var l=0, r=s.length -1;
	while(l < s.length && s[l] == ' ') l++;
	while(r > l && s[r] == ' ') r-=1;
	return s.substring(l, r+1);
}

function compareObjects(o1, o2) {
	var k = '';
	for(k in o1) if(o1[k] != o2[k]) return false;
	for(k in o2) if(o1[k] != o2[k]) return false;
	return true;
}

function itemExists(haystack, needle) {
	for(var i=0; i<haystack.length; i++) if(compareObjects(haystack[i], needle)) return true;
	return false;
}

function searchFor(toSearch) {
	var results = [];
	toSearch = trimString(toSearch); // trim it
	for(var i=0; i<latimes.data.length; i++) {
		for(var key in latimes.data[i]) {
			if(key != undefined)
			{
				if(latimes.data[i][key].toString().toLowerCase().indexOf(toSearch.toLowerCase())!=-1) {
					if(!itemExists(results, latimes.data[i])) results.push(latimes.data[i]);
				}
			}
		}
	}
	return results;
}


