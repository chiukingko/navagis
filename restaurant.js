class map_class {
	constructor() {
		this.map;
		this.selectedShape;
		this.drawingManager;
		this.infowindow;
		this.directionsService;
		this.directionsDisplay;
		this.center_map = {
			center: {lat: 10.3157, lng: 123.8854},
			zoom: 20
		};
		this.counter = 0;
		this.markers = [];
		this.marker;
		this.setDrawMap;
		this.getNextPage = null;
		this.service;
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

		$("#right-panel").css("display","none");
		$("#analytics").css("display","none");
		
		this.set_drawing_manager()
		this.set_event_listener()

		
	}  
	
	set_drawing_manager(){
		this.drawingManager = new google.maps.drawing.DrawingManager({
			drawingMode: 'circle',
			drawingControl: true,
			drawingControlOptions: {
				position: google.maps.ControlPosition.TOP_CENTER,
				drawingModes: ['circle', 'rectangle']
			},
			circleOptions: {
				fillColor: '#ffff00',
				fillOpacity: 0.5,
				strokeWeight: 0,
				clickable: true,
				draggable: false,
				editable: false,
				zIndex: 1
			},
			rectangleOptions: {
				fillColor: '#ffff00',
				fillOpacity: 0.5,
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
			alert("pass");
			this.clearMap();
			$('#analytics').html('');
			this.markers = [];
			var specialty = $("#specialty").val(); 
			if (specialty == 'all') {
				nearbyRequest = {location: this.center_map.center, radius: 500, type: ['restaurant']};
			}
			else {
				nearbyRequest = {location: this.center_map.center, radius: 500, keyword: specialty, type: ['restaurant']};
			}

			this.service.nearbySearch(nearbyRequest,
				function(results, status, pagination) {
					if (status !== 'OK') return;
					this.createMarkers(results);
					moreButton.disabled = !pagination.hasNextPage;
					this.getNextPage = pagination.hasNextPage && function() {
					pagination.nextPage();
				};
			});
		};
		this.setDrawMap = function () {
			this.drawingManager.setMap(this.map);
			draw.disabled = true;
		};
		
		this.setShapes = function(event) {
			var ID=[];
			
			if (event.type == google.maps.drawing.OverlayType.CIRCLE) {
				var rad = event.overlay.getRadius();
				var center = event.overlay.getCenter();

				
				for(var ctr in this.markers){
					if(google.maps.geometry.spherical.computeDistanceBetween(center,markers[k].getPosition())<=rad){
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
					if(event.overlay.getBounds().contains(markers[k].getPosition())){
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
			this.infowindow.addListener('closeclick', this.deleteShape.bind(this));
		};
		
		this.setDrawedShapes = function(event) {
			if (event.type != google.maps.drawing.OverlayType.POLYGON) {
				this.drawingManager.setDrawingMode(null);
				this.drawingManager.setOptions({
					drawingControl: false
				});
				var newShape = event.overlay;
				newShape.type = event.type;
				this.setSelection(newShape);
				
				this.selectNewShape = function() {
					this.setSelection(newShape);
				}
				google.maps.event.addListener(newShape, 'click', this.selectNewShape.bind(this));
			}
		}
		
		this.setNextPage = function() {
			$("#more").prop("disabled", true);
			if (this.getNextPage) getNextPage();
		};
		google.maps.event.addListener(document.getElementById('specialty'), 'onchange', this.setSearch.bind(this));
		google.maps.event.addListener(document.getElementById('more'), 'click', this.setNextPage.bind(this));
		google.maps.event.addListener(this.drawingManager, 'overlaycomplete', this.setDrawedShapes.bind(this));
		google.maps.event.addListener(this.drawingManager, 'overlaycomplete', this.setShapes.bind(this));
		google.maps.event.addListener(this.drawingManager, 'drawingmode_changed', this.clearSelection.bind(this));
		google.maps.event.addListener(this.map, 'click', this.clearSelection.bind(this));
		google.maps.event.addDomListener(document.getElementById('draw'), 'click', this.setDrawMap.bind(this))
		google.maps.event.addDomListener(document.getElementById('delete-button'), 'click',this.deleteShape.bind(this));
	}
	
	clearSelection() {
		if (this.selectedShape) {
			this.selectedShape.setEditable(false);
			this.selectedShape = null;
		}
	}
	
	setSelection(shape) {
		this.clearSelection();
		this.selectedShape = shape;
		shape.setEditable(false);
	}
	
	deleteShape(){ //delete selected shape
		if (this.selectedShape) {
			this.selectedShape.setMap(null);
			this.drawingManager.setOptions({
				drawingControl: true
			});
			this.infowindow.close();
		}
	}
	
	clearMap() {
		document.getElementById("places").innerHTML = "";
		document.getElementById('right-panel').style.display = 'none';
		this.directionsDisplay.setMap(null);
		for (var ctr = 0; ctr < markers.length; ctr++) {
			this.markers[ctr].setMap(null);
		}
	}
	calculateAndDisplayRoute(directionsService, directionsDisplay, destination) {
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
				window.alert('Directions request failed due to ' + status);
			}
		});
	}
	
	
	createMarkers(places) {
		var bounds = new google.maps.LatLngBounds();
		var placesList = document.getElementById('places');
  
		for (var i = 0, place; place = places[i]; i++) {
			var image = {
			  url: place.icon,
			  size: new google.maps.Size(71, 71),
			  origin: new google.maps.Point(0, 0),
			  anchor: new google.maps.Point(17, 34),
			  scaledSize: new google.maps.Size(25, 25)
			};

			var marker = new google.maps.Marker({
			  map: map,
			  icon: image,
			  title: place.name,
			  position: place.geometry.location
			});

			//assign listeners to marker
			marker.addListener('click', (
			function(marker, i) {
				return function() {
				  
					infowindow = new google.maps.InfoWindow({
					content: marker.title,
					position: marker.position,

					});        
					infowindow.open(map);
					map.setCenter(marker.getPosition());
					calculateAndDisplayRoute(this.directionsService, this.directionsDisplay, this.marker.position);
					this.directionsDisplay.setMap(map);
					document.getElementById('right-panel').style.display = 'block';
					directionsDisplay.setPanel(document.getElementById('right-panel'));
					document.getElementById('analytics').style.display = 'block';
					document.getElementById("analytics").innerHTML = "";

					var b = document.getElementById('analytics');
					var a = document.createElement('button');
					a.textContent = 'Visit';
					a.id = places[i].id;

					status = places[i].opening_hours['open_now']
					if (status == 'true' || status =='undefined') {
					status ='<font color="green">OPEN</font>'
					}
					else {
					status ='<font color="red">CLOSED</font>'
					}

					document.getElementById("analytics").innerHTML = "<b>Restaurant Info</b><br>" +
					places[i].name + "<p><b>Status</b> <br/>" +
					"<i><b>" + status + "</b></i>" +
					"<p><b>Address</b> <br/>" +
					places[i].vicinity + "<br/>" +
					"<p><b>User Rating</b> <br/>" +
					places[i].rating + " / 5 ("+places[i].user_ratings_total+") users <br/>" +
					"<p><b>Customers today</b> <br/>" + localStorage.getItem(places[i].id,counter);
					b.appendChild(a);
					// basic function to store number of customers in localStorage
					a.onclick = function (){
					alert("Thank you for visiting! " + places[i].name);
					localStorage.setItem(places[i].id,counter+=1)
					}
				}
			  })
			(marker, i));

			markers.push(marker);
			var li = document.createElement('li');
			li.textContent = place.name
			placesList.appendChild(li);
			bounds.extend(place.geometry.location);

			}
			map.fitBounds(bounds);
			google.maps.event.addDomListener(window, 'load', initMap);
		}
	}

	

