// Add all scripts to the JS folder

//GOAL: Proportional symbols representing attribute values of mapped features
//STEPS:

//Step 1. Create the Leaflet map--already done in createMap()
//Step 2. Import GeoJSON data--already done in getData()
//Step 3. Add circle markers for point features to the map--already done in AJAX callback
/* Map of GeoJSON data from MegaCities.geojson */
//declare map var in global scope
// Add all scripts to the JS folder

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

function calcMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var item of data){
        //loop through each year
        for(var year = 1950; year <= 2020; year+=10){
              //get population for current year
              var value = item.properties["POP"+ String(year)];
              //add value to array
              allValues.push(value);
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)

    return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 5;
    //Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.45) * minRadius

    return radius;
};


//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //SEQstep4  Assign the current attribute based on the first index of the attributes array

    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    console.log(attribute);

    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string starting with city...Example 2.1 line 24
    var popupContent = "<p><b>County:</b> " + feature.properties.COUNTY + "</p>";

    //add formatted attribute to popup content string; .match uses regular expression to isolate number in string
    var year = attribute.match(/\d+/g);
    //apply .toLocaleString to convert number into readable number
    popupContent += "<p><b>Population in " + year + ":</b> " + feature.properties[attribute].toLocaleString() + " people</p>";

    
    // //build popup content string
    // var popupContent = "<p><b>County:</b> " + feature.properties.COUNTY + "</p><p><b>" + attribute + ":</b> " + feature.properties[attribute] + "</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius) 
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Add circle markers for point features to the map
function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return  pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
          //Example 3.18 line 4
          if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //add city to popup content string
            var popupContent = "<p><b>County:</b> " + props.COUNTY + "</p>";

            //add formatted attribute to panel content string
            var year = attribute.match(/\d+/g);
            popupContent += "<p><b>Population in " + year + ":</b> " + props[attribute].toLocaleString() + " people</p>";


            //update popup content            
            popup = layer.getPopup();            
            popup.setContent(popupContent).update();
        };
    });
};


//Step SEQUENCE1: Create new sequence controls
function createSequenceControls(attributes){
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);

    //set slider attributes
    document.querySelector(".range-slider").max = 7;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse">Reverse</button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward">Forward</button>');

    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/reverse.png'>")
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward.png'>")
     
    //SEQ Step 5: click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){

        step.addEventListener("click", function(){
        //sequence
            })
    })

    //Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        //Step 6: get the new index value
        var index = this.value;
    });

    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
        var index = document.querySelector('.range-slider').value;

        //Step 6: increment or decrement depending on button clicked
        if (step.id == 'forward'){
            index++;
            //Step 7: if past the last attribute, wrap around to first attribute
            index = index > 7 ? 0 : index;
        } else if (step.id == 'reverse'){
            index--;
            //Step 7: if past the first attribute, wrap around to last attribute
            index = index < 0 ? 7 : index;
        };

        //Step 8: update slider
        document.querySelector('.range-slider').value = index;
            console.log(index);

            updatePropSymbols(attributes[index]);

        })
    });

   
    

};




//Above Example 3.10...Step 3: build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("POP") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);
    

    return attributes;
};

//Step 2: Import GeoJSON data
function getData(){
    //load the data
    fetch("data/micounty.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create attributes array for SEQ step 3
            var attributes = processData(json);
            //calculate minimum data value
            minValue = calcMinValue(json);
            //call function to create proportional symbols
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
        })
};

document.addEventListener('DOMContentLoaded',createMap)   

//Step 4. Determine the attribute for scaling the proportional symbols


//Step 5. For each feature, determine its value for the selected attribute


//Step 6. Give each feature's circle marker a radius based on its attribute value

