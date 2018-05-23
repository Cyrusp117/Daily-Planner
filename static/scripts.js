// The Login Functions
function onSuccess(googleUser) {
    console.log('Logged in as: ' + googleUser.getBasicProfile().getName());
    window.location.replace("index");
}
function onFailure(error) {
    console.log(error);
}
function renderButton() {
    gapi.signin2.render('my-signin2', {
                        'scope': 'profile email',
                        'width': 350,
                        'height': 70,
                        'longtitle': true,
                        'theme': 'dark',
                        'onsuccess': onSuccess,
                        'onfailure': onFailure
                        });
}
function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
    console.log('User signed out.');
    });
    auth2.disconnect();
}
// End Of Login Functions

// The Map Functions
// Client ID and API key from the Developer Console
var CLIENT_ID = '777718038660-mg1cq9kfcrt0fq4lrk681d9ualvcgrp1.apps.googleusercontent.com';
var API_KEY = 'AIzaSyAB7Zfk1cIw5ejq6x8Kol3qwNCv7R0NTJg';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

var map, currentloc;
var currEvent;

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
    }).then(function () {
    getNextEvent();
    listUpcomingEvents();
    });
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message, content) {
    var pre = document.getElementById(content);
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}

/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
function listUpcomingEvents() {
    gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'timeMin': (new Date()).toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 11,
    'orderBy': 'startTime'
    }).then(function(response) {
        var events = response.result.items;
        appendPre('Upcoming events:', 'content');

        if (events.length > 1) {
            for (i = 1; i < events.length; i++) {
                var event = events[i];
                var when = event.start.dateTime;
                if (!when) {
                    when = event.start.date;
                }
                appendPre(event.summary + ' (' + when + ')', 'content')
            }
        } else {
            appendPre('No upcoming events found.', 'content');
        }
    });
}

function getNextEvent() {
    gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'timeMin':  moment().format(),
    'timeMax':  moment().add(1, 'hours').format(),
    }).then(function(response) {
        var events = response.result.items;
        appendPre('Up next:', 'upcoming');

        if (events.length > 0) {
            var event = events[0];
            currEvent = event;
            console.log(currEvent);
            var when = event.start.dateTime;
            if (!when) {
                when = event.start.date;
            }
            appendPre(event.summary + ' (' + when + ')', 'upcoming');
            if (event.location) appendPre('    ' + event.location, 'upcoming');
            if (event.description) appendPre('    ' + event.description, 'upcoming');
            if(event.extendedProperties){
                if(event.extendedProperties.private.type === 'mealtime') initMap();
            }
        } else {
            appendPre('No event now', 'upcoming');
        }
    }).then(function(response) {
        initMap2();
    });
}

function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            var place = results[i];
            createMarker(results[i]);
            // create a list of info
            addrestaurant(place);
        }
        console.log(results);
        return results;
    }
}
function addrestaurant(restaurant){
    var x = document.createElement("DIV");
    x.className = "res_box";
    var t = document.createTextNode(restaurant.name);
    var title = document.createElement("SPAN");
    title.style.fontFamily = '"Times New Roman", Times, serif';
    title.style.fontSize = '20px';
    title.style.fontStyle = 'italic';
    title.style.fontWeight = 'bold';
    title.appendChild(t);
    x.appendChild(title);
    if(restaurant.photos){
        var i = document.createElement("IMG");
        i.setAttribute("src", restaurant.photos[0].getUrl({'maxWidth': 100, 'maxHeight': 100}));
        i.setAttribute("alt", restaurant.name);
        i.style.float= 'right';
        x.appendChild(i);
    }
    var rating = document.createTextNode("Google Rating:  " + restaurant.rating);

    //.getUrl({'maxWidth': 35, 'maxHeight': 35})
    var loc = document.createTextNode(restaurant.vicinity);
    var loc_span = document.createElement("SPAN");
    loc_span.style.color = "grey";
    loc_span.style.fontSize = '10px';
    loc_span.style.fontStyle = 'italic';
    loc_span.appendChild(document.createElement("br"));
    loc_span.appendChild(loc);
    loc_span.appendChild(document.createElement("br"));
    loc_span.appendChild(rating);
    x.appendChild(loc_span)
    document.getElementById("restaurants").appendChild(x);
}

function initMap() {
    var restaurant_box = document.getElementById('restaurant_box');
    restaurant_box.style.display = "block";
    console.log(restaurant_box);
    map = new google.maps.Map(document.getElementById('re_map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 15
    });
    var GeoMarker = new GeolocationMarker(map);
    console.log(map);

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            map.setCenter(pos);
            var request = {
                location: pos,
                radius: '500',
                type: ['restaurant']
            };
            console.log(request);
            searchIfMealtime(map, request);
        }, function() {
            handleLocationError(true, currentloc, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, currentloc, map.getCenter());
    }
}

var map2;
function initMap2() {
    // Try HTML5 geolocation.
    var pos;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            pos = String(position.coords.latitude) +"," + String(position.coords.longitude);
            console.log(pos);
            console.log(currEvent);
            var mapframe = document.getElementById("destinationMap");
            var placeCode = currEvent.location.replace(/ /g, "+");
            mapframe.src = "https://www.google.com/maps/embed/v1/directions?key=AIzaSyAB7Zfk1cIw5ejq6x8Kol3qwNCv7R0NTJg"+" &origin=" + pos +" &destination=" + placeCode;
            console.log(mapframe.src);
        }, function() {
            handleLocationError(true, currentloc, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, currentloc, map.getCenter());
    }
}
function searchIfMealtime(map, loc){
    var request = gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin':  moment().format(),
        'timeMax':  moment().add(1, 'hours').format(),
        'privateExtendedProperty' : 'type = mealtime'
    });
    request.execute(function(response){
        console.log(response);
        if(response){
            if(response.items[0].extendedProperties.private.type === 'mealtime'){
                service = new google.maps.places.PlacesService(map);
                service.nearbySearch(loc, callback);
            }
        }
    });
}
function createMarker(place) {
    var photos = place.photos;
    if (!photos) {
        new google.maps.Marker({
            position: place.geometry.location,
            map: map
        });
        return;
    }

    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        title: place.name,
    });
}
function handleLocationError(browserHasGeolocation, currentloc, pos) {
    currentloc.setPosition(pos);
    currentloc.setContent(browserHasGeolocation ?
    'Error: The Geolocation service failed.' :
    'Error: Your browser doesn\'t support geolocation.');
    currentloc.open(map);
}
// End Of Map Functions

// The Edit Task Functions
function handleClientLoad() {
    // Loads the client library and the auth2 library together for efficiency.
    // Loading the auth2 library is optional here since `gapi.client.init` function will load
    // it if not already loaded. Loading it upfront can save one network request.
    gapi.load('client:auth2', Initialize);
}
function Initialize() {
    // 2. Initialize the JavaScript client library.
    gapi.client.init({
      'apiKey': API_KEY,
      // Your API key will be automatically added to the Discovery Document URLs.
      'discoveryDocs': DISCOVERY_DOCS,
      // clientId and scope are optional if auth is not required.
      'clientId': CLIENT_ID,
      'scope': SCOPES,
    }).then(function () {
        autofillform();
    });
};
function autofillform(){//auto fill the taskform
    var taskfrm = document.forms["taskform"];
    var isExist = sessionStorage.getItem("eventexist");
    if(isExist === 'true'){//if event already exist, autofill the taskform
        console.log(isExist);
        var eventId = sessionStorage.getItem("GeventId");
        getGevent(eventId,function(Gevent){
            console.log('huzzah, I\'m done!');
            taskfrm.taskTitle.value = Gevent.summary;
            if(Gevent.start.date){//if it's all day event
                taskfrm.all_day.checked = true;
                alldaydisplay();
                taskfrm.f_date.value = Gevent.start.date;
                taskfrm.t_date.value = Gevent.end.date;
            }
            else{
                taskfrm.all_day.checked = false;
                var startTime = Gevent.start.dateTime;
                var endTime = Gevent.end.dateTime;
                alldaydisplay();
                sliceTime(taskfrm, startTime, endTime);
            }
            if(Gevent.location){
                taskfrm.destination.value = Gevent.location;
            }
            if(Gevent.description){
                taskfrm.description.value = Gevent.description;
            }
            if(Gevent.extendedProperties){
                taskfrm.type.value = Gevent.extendedProperties.private.type;
            }
        });
    }
    else{//when inserting new event to calendar
        if(sessionStorage.getItem("eventAllDay") === 'true'){
            //if it's all  day event
            taskfrm.all_day.checked = true;
            alldaydisplay();
            taskfrm.f_date.value = sessionStorage.getItem("eventStart");
            taskfrm.t_date.value = sessionStorage.getItem("eventEnd");
        }
        else{
            taskfrm.all_day.checked = false;
            alldaydisplay();
            var startTime = sessionStorage.getItem("eventStart");
            var endTime = sessionStorage.getItem("eventEnd");
            taskfrm.f_date.value = startTime.slice(0,startTime.indexOf("T")) ;
            taskfrm.f_time.value = startTime.slice(1+startTime.indexOf("T")) ;
            taskfrm.t_date.value = endTime.slice(0,endTime.indexOf("T")) ;
            taskfrm.t_time.value = endTime.slice(1+endTime.indexOf("T")) ;
        }
    }
}
function alldaydisplay(){
    var taskfrm = document.forms["taskform"];
    if(taskfrm.all_day.checked){
        taskfrm.t_time.style.display = "none";
        taskfrm.f_time.style.display = "none";
    }
    else{
        taskfrm.t_time.style.display = "inline";
        taskfrm.f_time.style.display = "inline";
    }
}
function checkallday(){
    var taskfrm = document.forms["taskform"];
    alldaydisplay();
    taskfrm.f_time.value = moment().format("hh:mm:ss");
    taskfrm.t_time.value = moment().add(1,'hour').format("hh:mm:ss");
}
function getGevent(eventId,_callback){
    var request = gapi.client.calendar.events.get({
        'calendarId': 'primary',
        'eventId':eventId,
    });
    request.execute(function(response) {
        if (!response) {
            console.log('error getting event');
            console.log(response);
        } else {
            console.log('event got');
            console.log(response);
            _callback(response);
        }
    });

}
function sliceTime(taskfrm, startTime, endTime){
    taskfrm.f_date.value = startTime.slice(0,startTime.indexOf("T")) ;
    taskfrm.f_time.value = startTime.slice(1+startTime.indexOf("T"),startTime.indexOf("+")) ;
    taskfrm.t_date.value = endTime.slice(0,endTime.indexOf("T")) ;
    taskfrm.t_time.value = endTime.slice(1+endTime.indexOf("T"),endTime.indexOf("+")) ;
}
function formatTime(taskfrm){//check if the date and time in taskform is in correct format and make it a moment object
    if(!taskfrm.all_day.checked){//if it's all day event, don't need to check
        var f_datetime = moment.tz(taskfrm.f_date.value +" "+ taskfrm.f_time.value,moment.tz.guess());
        var t_datetime = moment.tz(taskfrm.t_date.value +" "+ taskfrm.t_time.value, moment.tz.guess());
        if(!t_datetime._isValid || !f_datetime._isValid){
            alert("Invalid time format, correct format is hours:minutes");
        }
        if(!f_datetime._isValid){
            f_datetime = moment();
        }
        if(!t_datetime._isValid){
            t_datetime = moment().add(1,'hour');
        }
        taskfrm.f_datetime = f_datetime.format();
        taskfrm.t_datetime = t_datetime.format();
        sliceTime(taskfrm, taskfrm.f_datetime, taskfrm.t_datetime);
    }
}
function saveTask(){
    var taskfrm = document.forms["taskform"];
    formatTime(taskfrm);
    if(!taskfrm.taskTitle.value){
        taskfrm.taskTitle.value = "No title";
    }
    if(sessionStorage.getItem("eventexist")){
        updateTask(taskfrm);
    }
    else{
        insertTask(taskfrm);
    }
    backToSchedule();
}
function deleteTask(taskfrm){
    if(sessionStorage.getItem('eventexist')){//if the event do exist
        var eventId = sessionStorage.getItem('GeventId');
        var request = gapi.client.calendar.events.delete({
            'calendarId': 'primary',
            'eventId': eventId
        });
        request.execute(function(response) {
            if (!response) {
                console.log('event delete threw error');
                console.log(response);
            } else {
                console.log('event deleted');
                $('#calendar').fullCalendar('removeEvents', eventId);
            }
        });
    }
    else{//else only delete the local event.
        $('#calendar').fullCalendar('removeEvents', eventId);
    }
    backToSchedule();
}
function backToSchedule(){
    sessionStorage.removeItem('GeventId');
    sessionStorage.removeItem('localEvent');
    sessionStorage.removeItem('eventexist');
    window.location.replace("schedule");
}
function insertTask(taskfrm){
    var desc;
    var location;
    var eventToSave = {};
    var localevent = new Object();
    localevent.destination = taskfrm.destination.value; // formatted address for gCal
    localevent.description = taskfrm.description.value;
    localevent.title = taskfrm.taskTitle.value;
    if (taskfrm.all_day.checked) {
        eventToSave = {
            'summary': localevent.title,
            'location': localevent.destination,
            'description': localevent.description,
            'start': {
                'date': taskfrm.f_date.value
            },
            'end': {
                'date': taskfrm.t_date.value
            },
            "extendedProperties": {
                "private": {
                  "type": localevent.type
                }
            }
        };
        localevent.start = taskfrm.f_date.value;
        localevent.end = taskfrm.t_date.value;
    } else {
        var f_dateTime = taskfrm.f_datetime;
        var t_dateTime = taskfrm.t_datetime;
        eventToSave = {
            'summary': localevent.title,
            'location': localevent.destination,
            'description': localevent.description,
            'start': {
                'dateTime': f_dateTime
            },
            'end': {
                'dateTime': t_dateTime
            },
            "extendedProperties": {
                "private": {
                  "type": localevent.type
                }
            }
        };
        localevent.start = f_dateTime;
        localevent.end = t_dateTime;
    }
    console.log(eventToSave);
    console.log(localevent);
    var request = gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': eventToSave
    });
    request.execute(function(response) {
        if (!response) {
            console.log('error adding event');
            console.log(response);
        } else {
            console.log('event added');
            console.log(response);
            $('#calendar').fullCalendar('addEvent', localevent); // stick? = true
        }
    });
}
function updateTask(taskfrm){
    var desc;
    var location;
    var eventToSave = {};
    var localevent = new Object();
    localevent.destination = taskfrm.destination.value; // formatted address for gCal
    localevent.description = taskfrm.description.value;
    localevent.title = taskfrm.taskTitle.value;
    localevent.id = sessionStorage.getItem("GeventId");//get original event id
    localevent.type = taskfrm.type.value;
    if (taskfrm.all_day.checked) {
        eventToSave = {
            'summary': localevent.title,
            'location': localevent.destination,
            'description': localevent.description,
            'start': {
                'date': taskfrm.f_date.value
            },
            'end': {
                'date': taskfrm.t_date.value
            },
            "extendedProperties": {
                "private": {
                  "type": localevent.type
                }
            }

        };
        localevent.start = taskfrm.f_date.value;
        localevent.end = taskfrm.t_date.value;
    } else {
        var f_dateTime = taskfrm.f_datetime;
        var t_dateTime = taskfrm.t_datetime;
        eventToSave = {
            'summary': localevent.title,
            'location': localevent.destination,
            'description': localevent.description,
            'start': {
                'dateTime': f_dateTime
            },
            'end': {
                'dateTime': t_dateTime
            },
            "extendedProperties": {
                "private": {
                  "type": localevent.type
                }
            }

        };
        localevent.start = f_dateTime;
        localevent.end = t_dateTime;
    }
    console.log(eventToSave);
    console.log(localevent);
    var request = gapi.client.calendar.events.update({
        'calendarId': 'primary',
        'eventId': localevent.id,
        'resource': eventToSave
    });
    request.execute(function(response) {
        if (!response) {
            console.log('error updating event');
            console.log(response);
        } else {
            console.log('event updated');
            console.log(response);
            $('#calendar').fullCalendar('updateEvent', localevent); // stick? = true
        }
    });
}
function initAutocomplete(){
    var placeInput = document.getElementsByName("destination");
    console.log(placeInput[0]);
    var autocomplete = new google.maps.places.Autocomplete(placeInput[0]);


    autocomplete.addListener('place_changed', function() {
        var place = autocomplete.getPlace();

        var address = '';
        if (place.address_components) {
            address = [
            (place.address_components[0] && place.address_components[0].short_name || ''),
            (place.address_components[1] && place.address_components[1].short_name || ''),
            (place.address_components[2] && place.address_components[2].short_name || '')
            ].join(' ');
        }
        console.log(address);
    });
}
// End Of Edit Task Functions