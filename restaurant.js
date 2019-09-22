class map_class {
	constructor() {
		this.map;
		this.selectedShape;
		this.drawingManager;
		this.infowindow;
		this.infowindows = [];
		this.directionsService;
		this.directionsDisplay;
		this.center_map = {
			center: {lat: 10.304322, lng: 123.8852193},
			zoom: 14
		};//Center Map Location
		this.counter = 0;
		this.markers = [];
		this.marker;
		this.set_draw_map;
		this.service;
		this.nearbyRequest = null;3
		
	}
	
	init() {
		//initialize content from google maps
		this.map = new google.maps.Map(document.getElementById('map'), this.center_map);
		this.directionsDisplay = new google.maps.DirectionsRenderer;
		this.directionsService = new google.maps.DirectionsService;
		this.service = new google.maps.places.PlacesService(this.map);
		this.marker = new google.maps.Marker({
			  position: this.center_map.center,
			  map: this.map
		});

		this.set_drawing_manager();
		this.set_event_listener();
	}  
	
	set_drawing_manager(){
		//Setting up shape for drawing
		this.drawingManager = new google.maps.drawing.DrawingManager({
			drawingMode: 'circle',
			drawingControl: true,
			drawingControlOptions: {
				position: google.maps.ControlPosition.TOP_CENTER,
				drawingModes: ['circle', 'rectangle']
			},
			circleOptions: {
				fillColor: '#ffff00',
				fillOpacity: 0.4,
				strokeWeight: 0,
				clickable: true,
				draggable: false,
				editable: false,
				zIndex: 1
			},
			rectangleOptions: {
				fillColor: '#ffff00',
				fillOpacity: 0.4,
				strokeWeight: 0,
				clickable: true,
				draggable: false,
				editable: false,
				zIndex: 1
			}
		});
	}
	
	set_event_listener(){
		// Setting up the Event listeners 
		
		this.setSearch = function() {
			this.clear_map();
			$('#analytics').html('');
			this.markers = [];
			var specialty = $("#specialty").val(); 
			if (specialty != '') {
				this.nearbyRequest = {location: this.center_map.center, 
									  radius: 600, 
									  keyword: specialty, 
									  type: ['restaurant'],
									  };
				this.service.nearbySearch(this.nearbyRequest,
									      function(results, status, pagination) {
									      	if (status !== 'OK') return;
									      	this.create_markers(results);
									      }.bind(this));
			}
		};
		
		this.set_draw_map = function () {
			this.drawingManager.setMap(this.map);
			$("#draw-button").disabled = true;
		};
		
		this.set_shapes = function(event) {
			var ID=[];
			
			if (event.type == google.maps.drawing.OverlayType.CIRCLE) {
				var rad = event.overlay.getRadius();
				var center = event.overlay.getCenter();

				
				for(var ctr in this.markers){
					if(google.maps.geometry.spherical.computeDistanceBetween(center,this.markers[ctr].getPosition())<=rad){
						ID.push(ctr);
						this.markers[ctr].setMap(this.map);
					}     
				}
				var matches = "Number of restaurants: " + ID.length.toString();
				this.infowindow = new google.maps.InfoWindow({
					content: matches,
					position: center,
				});
				
			}
			else {
				for(var ctr in this.markers){
					if(event.overlay.getBounds().contains(this.markers[ctr].getPosition())){
						ID.push(ctr);
						this.markers[ctr].setMap(this.map);
					}       
				} 
				var matches = "Number of restaurants: " + ID.length.toString();
				this.infowindow = new google.maps.InfoWindow({
					content: matches,
					position: event.overlay.getBounds().getCenter(),
				});
			}
			
			this.infowindow.open(this.map);
			this.infowindow.addListener('closeclick', this.delete_shape.bind(this));
			
			if (event.type != google.maps.drawing.OverlayType.POLYGON) {
				this.drawingManager.setDrawingMode(null);
				this.drawingManager.setOptions({
					drawingControl: false
				});
				var newShape = event.overlay;
				newShape.type = event.type;
				this.set_selection(newShape);
				
				this.selectNewShape = function() {
					this.set_selection(newShape);
				}
				google.maps.event.addListener(newShape, 'click', this.selectNewShape.bind(this));
			}
		};
		
		$("#specialty" ).on("change", this.setSearch.bind(this));
		$("#draw-button" ).on("click", this.set_draw_map.bind(this));
		$("#delete-button" ).on("click", this.delete_shape.bind(this));
		google.maps.event.addListener(this.drawingManager, 'overlaycomplete', this.set_shapes.bind(this));
		google.maps.event.addListener(this.drawingManager, 'drawingmode_changed', this.clear_selection.bind(this));
		google.maps.event.addListener(this.map, 'click', this.clear_selection.bind(this));
	}
	
	clear_selection() {
		if (this.selectedShape) {
			this.selectedShape.setEditable(false);
			this.selectedShape = null;
		}
	}
	
	set_selection(shape) {
		this.clear_selection();
		this.selectedShape = shape;
		shape.setEditable(false);
	}
	
	delete_shape(){ //delete selected shape
		if (this.selectedShape) {
			this.selectedShape.setMap(null);
			this.drawingManager.setOptions({
				drawingControl: true
			});
			this.infowindow.close();
		}
	}
	
	clear_map() {
		document.getElementById("places").innerHTML = "";
		document.getElementById('right-panel').style.display = 'none';
		this.directionsDisplay.setMap(null);
		for (var ctr = 0; ctr < this.markers.length; ctr++) {
			this.markers[ctr].setMap(null);
			
		}
		for (var ctr = 0; ctr < this.infowindows.length; ctr++) {
			this.infowindows[ctr].close();
		}
	}
	
	calculate_and_display_route(directionsService, directionsDisplay, destination, infowindow) {
		directionsService.route({
			origin: this.center_map.center,
			destination: destination,
			travelMode: 'DRIVING'
		}, 
		function(response, status) {
			if (status === 'OK') {
				directionsDisplay.setDirections(response);
				infowindow.close()
			} 
			else {
				window.alert('Directions request failed:' + status);
			}
		});
	}
	
	create_markers(places) {
		var bounds = new google.maps.LatLngBounds();
		var placesList = $('#places')[0];
	
		
		for (var i = 0, place; place = places[i]; i++) {
			this.place = place
			var image = {
			  url: this.place.icon,
			  size: new google.maps.Size(65, 65),
			  origin: new google.maps.Point(0, 0),
			  anchor: new google.maps.Point(17, 34),
			  scaledSize: new google.maps.Size(25, 25)
			};

			this.marker = new google.maps.Marker({
			  map: this.map,
			  icon: image,
			  title: this.place.name,
			  animation: google.maps.Animation.DROP,
			  position: this.place.geometry.location,
			});
	
			
			var markerEvent = function(plac, mark, map){
			
				var contentString = "<div><h4>"+mark.title+"</h4></div>"
				
				var infowindow = new google.maps.InfoWindow({
					content: contentString,
					position: mark.position,
					
				});        
				this.infowindows.push(infowindow);
				infowindow.open(map);
				map.setCenter(mark.getPosition());
				var b = document.getElementById('analytics');
				var a = document.createElement('button');
				var hr =  document.createElement('hr');
				a.textContent = 'Visit / Direction';
				a.id = plac.id;
				if ('opening_hours' in plac) {
					if (plac.opening_hours.open_now)
						status ='<font color="green">OPEN</font>'
					else
						status ='<font color="red">CLOSED</font>'
				}
				else
					status ='<font color="gray">N/A</font>'
				
				var counter = parseInt(localStorage.getItem(plac.id))
				if (counter == null) counter = 0;
	
				document.getElementById("analytics").innerHTML = "<b>Restaurant Info</b><br>" +
				plac.name + "<p><b>Store Open Status</b> <br/>" +
				"<i><b>" + status + "</b></i>" +
				"<p><b>Address</b> <br/>" +
				plac.vicinity + "<br/>" +
				"<p><b>User Rating</b> <br/>" +
				plac.rating + " / 5 ("+plac.user_ratings_total+") users <br/>" +
				"<p><b>Customers today</b> <br/><span id='visit'>" + counter +"</span>";
				b.appendChild(a);
				b.appendChild(hr);
				a.onclick = function (){
					//Update visit
					localStorage.setItem(plac.id, counter+=1);
					$("#visit").html(localStorage.getItem(plac.id))
					
					//Get direction 
					this.calculate_and_display_route(this.directionsService, this.directionsDisplay, mark.position, infowindow);
					this.directionsDisplay.setMap(this.map);
					document.getElementById('right-panel').style.display = 'block';
					this.directionsDisplay.setPanel(document.getElementById('right-panel'));
					document.getElementById('analytics').style.display = 'block';
				
				}.bind(this)
			};
			
			//assign listeners to marker
			google.maps.event.addDomListener(this.marker, 'click', markerEvent.bind(this, this.place, this.marker, this.map));
			this.markers.push(this.marker);
			var li = document.createElement('li');
			li.textContent = this.place.name
			google.maps.event.addDomListener(li, 'click', markerEvent.bind(this, this.place, this.marker, this.map));
			placesList.appendChild(li);
			bounds.extend(this.place.geometry.location);

		}
		this.map.fitBounds(bounds);
	}
}

	

