// All Login Functions
function onSuccess(googleUser) {
    console.log('Logged in as: ' + googleUser.getBasicProfile().getName());
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

// All Edit Task Functions
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

// The Movie Functions
function checkMovieOption() {           // Displays "Choose Movie" button when movie option selected
    var taskfrm = document.forms["taskform"];  
    var option = taskfrm.type.value;
    if (option == "movie") taskfrm.movieBtn.style.visibility = 'visible';
    else taskfrm.movieBtn.style.visibility = 'hidden';
}
function displayMovieModal() {          // Display the movie modal box
    var modal = document.getElementById("movieModal");
    modal.style.display = "block";
}
function closeMovieModal() {            // Close the movie modal box
    var modal = document.getElementById("movieModal");
    modal.style.display = "none";
}
function removeOptions(selectbox) {     // Clear a drop-down list
    for (var i = selectbox.options.length - 1; i >= 0; i--) {
        selectbox.remove(i);
    }
}
function findCinemas() {

}
function submitMovieInfo() {
    closeMovieModal();
}
// End Of Movie Functions