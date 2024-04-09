/* Map of GeoJSON data from MegaCities.geojson */
//declare map var in global scope
var map;
var minValue;
//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [43, -84],
        zoom: 7
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData();
};

// define "calcMinValue", used to calculate minimum value in a seperate dataset(array) in order to range it
function calcMinValue(data){
    // create an empty array to store all data values (outside of the micounty.geojson)
    var allValues = [];
    // loop through each county, item being the index to point at different elements in micounty.geojson
    for(var item of data){
        // loop through each year (loop within loop, "threading"), look at one element, then loop through the year based on that element (county)
        for(var year = 1950; year <= 2020; year+=10){
              // get population for the year the loop is on
              // string  POP + string 1950 points to current county in loop
              var value = item.properties["POP"+ String(year)];
              // push the current value the loop is on to the new array, then goes back to the for loop (until it finishes).
              allValues.push(value);
        }
    }
    // get minimum value of our array
    // "..." is the syntax within the Math.min method
    var minValue = Math.min(...allValues)

    return minValue;
}

// define a function to calculate the radius of each proportional symbol for the map
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 5;
    //Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.45) * minRadius

    return radius;
};


// define a function to convert marker symbols into circle marker symbols
function pointToLayer(feature, latlng, attributes){
    // Assign the current attribute based on the first index of the attributes array ([0] is the first element in the array "attributes" from derived from micounty.geojson)
    // Determine which attribute to visualize with proportional symbols, starting with POP1950
    var attribute = attributes[0];

    // create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute - turn the attribute into a number
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    // build popup content string starting with county
    var popupContent = "<p><b>County:</b> " + feature.properties.COUNTY + "</p>";

    // add formatted attribute to popup content string; .match uses regular expression to isolate number in string
    var year = attribute.match(/\d+/g);
    // apply .toLocaleString to convert number into readable number
    popupContent += "<p><b>Population in " + year + ":</b> " + feature.properties[attribute].toLocaleString() + " people</p>";

    // bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius) 
    });

    // return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

// Add circle markers (based on func.s above) for point features to the map
function createPropSymbols(data, attributes){
    // create a Leaflet GeoJSON layer and add it to the map using the data we have been working with
    L.geoJson(data, {
        // calling a function that calls itself -- putting things on the map but only defining one
        pointToLayer: function(feature, latlng){
            return  pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

// define a function that resizes the proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
          // if circle layer's current feature (county) and the feature's properties point to the attribute (year), then...
          if (layer.feature && layer.feature.properties[attribute]){
            // define variable "props" which accesses all of the feature's properties
            var props = layer.feature.properties;

            // define variable to update each feature's radius based on new attribute values using func "calcPropRadius" 
            // (based on the current index (year) of "props", update radius)
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            // add county to popup content string
            var popupContent = "<p><b>County:</b> " + props.COUNTY + "</p>";

            // add the formatted attribute to panel content string, as well as the popup content
            var year = attribute.match(/\d+/g);
            popupContent += "<p><b>Population in " + year + ":</b> " + props[attribute].toLocaleString() + " people</p>";


            // update popup content            
            popup = layer.getPopup();            
            popup.setContent(popupContent).update();
        };
    });
};


// define function "createSequenceControls" to create new sequence controls based on the attributes
function createSequenceControls(attributes){
    // define a variable to set the maximum index for the attributes array
    var max = attributes.length-1;
    // create a range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);

    // set the slider's attributes, make universal by setting maximum value to "attributes.length-1"
    document.querySelector(".range-slider").max = max;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    // create buttons for the slider
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse">Reverse</button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward">Forward</button>');

    // add images to the slider
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/reverse.png'>")
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward.png'>")
     
    // add input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        // get a the new index value
        var index = this.value;
    });

    // add a click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
        // locally define index based on the range slider's value
        var index = document.querySelector('.range-slider').value;

        // increment or decrement the index based on when the button is clicked
        if (step.id == 'forward'){
            index++;
            // if the index goes past the last attribute, wrap around to the first attribute
            index = index > max ? 0 : index;
        } else if (step.id == 'reverse'){
            index--;
            // if the index goes past the first attribute, wrap around to the last attribute
            index = index < 0 ? max : index;
        };

        // update the slider so that the range slider is equal to the current index
        document.querySelector('.range-slider').value = index;
        
            // calling the function "updatePropSymbols" based on the attribute's (POP) current index
            updatePropSymbols(attributes[index]);

        })
    });

   
    

};

// build an attributes array from the data
function processData(data){
    // empty the array to hold attributes
    var attributes = [];

    // define variable properties as the first feature in the dataset
    var properties = data[0].properties;

    // push each attribute name into attributes array using a for loop
    for (var attribute in properties){
        // use an if statement to make sure it only takes attributes with population values
        if (attribute.indexOf("POP") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};

// Import the geojson data
function getData(){
    // load the geojson data by calling function "fetch", using .then promise method to return function "response" through .json promise method
    fetch("data/micounty.geojson")
        // when the info is fetched, .then will process the response
        .then(function(response){
            // console.log("response", response); can check the http status (you want 200). Promise "promises" to tell you what the response will be and if there is data
            return response.json();
        })
        .then(function(json){
            // start processing the data by defining variable "attributes" as an array for sequences through function "processData" of function json
            var attributes = processData(json);
            // calculates the minimum data value of function jason
            minValue = calcMinValue(json);
            // call the function that creates proportional symbols 
            createPropSymbols(json, attributes);
            // call function that creates sequence controls
            createSequenceControls(attributes);
        })
};

// add the DOMContentLoaded event listener which creates the map through createMap function
document.addEventListener('DOMContentLoaded',createMap) 