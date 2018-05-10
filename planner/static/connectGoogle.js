var primaryevents = [];//the events array of primary calendar

  // Client ID and API key from the Developer Console
  var CLIENT_ID = '777718038660-mg1cq9kfcrt0fq4lrk681d9ualvcgrp1.apps.googleusercontent.com';
  var API_KEY = 'AIzaSyAB7Zfk1cIw5ejq6x8Kol3qwNCv7R0NTJg';

  // Array of API discovery doc URLs for APIs used by the quickstart
  var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  var SCOPES = "https://www.googleapis.com/auth/calendar";
  function handleClientLoad() {
    // Loads the client library and the auth2 library together for efficiency.
    // Loading the auth2 library is optional here since `gapi.client.init` function will load
    // it if not already loaded. Loading it upfront can save one network request.
    gapi.load('client:auth2', start);
  }
  function start() {
    // 2. Initialize the JavaScript client library.
    gapi.client.init({
      'apiKey': API_KEY,
      // Your API key will be automatically added to the Discovery Document URLs.
      'discoveryDocs': DISCOVERY_DOCS,
      // clientId and scope are optional if auth is not required.
      'clientId': CLIENT_ID,
      'scope': SCOPES,
    }).then(function () {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
      // Handle the initial sign-in state.
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    }).then(function() {
      // 3. Initialize and make the API request.
      return gapi.client.request({
        'path' : 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      })
    }).then(function(response) {
      primaryevents = response.result;
      console.log(response.result);
      handleSyncEvents()
    }, function(reason) {
      console.log('Error: ');
    });
  };
  
  function updateSigninStatus(isSignedIn) {
    // When signin status changes, this function is called.
    // If the signin status is changed to signedIn, we make an API call.

    if (isSignedIn) {

    }

  }

  function handleSignInClick(event) {
    // Ideally the button should only show up after gapi.client.init finishes, so that this
    // handler won't be called before OAuth is initialized.
    gapi.auth2.getAuthInstance().signIn();
    handleClientLoad()
  }

  function handleSignOutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
    handleClientLoad()
  }

  $(document).ready(function() {

    $('#calendar').fullCalendar({
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      navLinks: true, // can click day/week names to navigate views
      selectable: true,
      selectHelper: true,
      select: function(start, end) {
        var modal = document.getElementById('myModal');
        // Get the <span> element that closes the modal
        var span = document.getElementsByClassName("close")[0];
        var title = document.getElementById("eventTitle");
        var save = document.getElementById("Save");
        var cancel = document.getElementById("Cancel");
        var del = document.getElementById("Delete");
        modal.style.display = "block";        
        // When the user clicks on <span> (x), close the modal
        var newEvent = new Object(); 
        newEvent.title = title.value;          
        newEvent.start = start;
        newEvent.end = end;
        newEvent.allDay = start._ambigTime;//determine if it's an all day event
        $('#calendar').fullCalendar('renderEvent', newEvent, true);
        sessionStorage.removeItem("eventexist");
        sessionStorage.setItem("localEvent", newEvent);//store local event
        console.log(sessionStorage.getItem("localEvent"));
        span.onclick = function() {
          $('#calendar').fullCalendar('removeEvents', newEvent.id);
          modal.style.display = "none";
        }
        cancel.onclick = function() {
          $('#calendar').fullCalendar('removeEvents', newEvent.id);
          modal.style.display = "none";
        }

        del.onclick = function() {
          $('#calendar').fullCalendar('removeEvents', newEvent.id);
          modal.style.display = "none";
        }

        save.onclick = function() {
          if(title.value){
            newEvent.title = title.value;          
          }
          else{
            newEvent.title = "No title";
          }
          $('#calendar').fullCalendar('removeEvents', newEvent.id);
          insertEvent(newEvent);
          modal.style.display = "none";
        }
        $('#calendar').fullCalendar('unselect');
        title.value = "";
      },
      eventClick: function(calEvent, jsEvent, view) {
       
        var modal = document.getElementById('myModal');
        var mapModel = document.getElementById('mapModel');
        // Get the <span> element that closes the modal
        var span = document.getElementsByClassName("close")[0];
        var span2 = document.getElementsByClassName("close")[1];
        var title = document.getElementById("eventTitle");
        var save = document.getElementById("Save");
        var cancel = document.getElementById("Cancel");
        var del = document.getElementById("Delete");
        var map = document.getElementById("Map");
        sessionStorage.setItem("eventexist",true);
        sessionStorage.setItem("GeventId",calEvent.id);//store eventID into session.
        sessionStorage.setItem("localEvent", calEvent);//store local event
        title.value = calEvent.title;
        console.log(calEvent);
        modal.style.display = "block";        
        // When the user clicks on <span> (x), close the modal
        map.onclick = function() {
          modal.style.display = "none";
          title.value = "";
          mapModel.style.display = "block";
        }
        span2.onclick = function() {
          mapModel.style.display = "none";
        }
        span.onclick = function() {
          modal.style.display = "none";
          title.value = "";
        }
        cancel.onclick = function() {
          modal.style.display = "none";
          title.value = "";
        }
        del.onclick = function() {
          deleteEvent(calEvent);
          modal.style.display = "none";
          title.value = "";
          sessionStorage.removeItem("eventexist");
          sessionStorage.removeItem('GeventId');
          sessionStorage.removeItem('localEvent');
        }
        save.onclick = function() {
          var oldEvent = new Object();
          oldEvent = calEvent;
          calEvent.title = title.value;
          deleteEvent(oldEvent);       
          insertEvent(calEvent);
          modal.style.display = "none";
          title.value = "";
        }
        // change the border color just for fun
        $(this).css('border-color', 'red');
    
      },
      eventDrop: function(event, delta, revertFunc)  {
        updateEvent(event);
      },
      eventResize: function(event, delta, revertFunc) {
        updateEvent(event);
      },
      editable: true,
      eventLimit: true, // allow "more" link when too many events
      googleCalendarApiKey: 'AIzaSyAB7Zfk1cIw5ejq6x8Kol3qwNCv7R0NTJg',
      events: {
        googleCalendarId: 'en-gb.australian#holiday@group.v.calendar.google.com',
        editable: false,
        color: 'green'
      },
      color: 'black',     // an option!
      textColor: 'yellow' // an option!
    });
  });

  var handleSyncEvents = (function () {
    //need to check signin state before this
    var executed = false;
    return function() {
      if (!executed) {
        executed = true;
        var items = primaryevents.items;
        events = []; // put the array in the `events` property    
        for(i = 0;i < items.length; i++)
        { 
          var event = new Object();
          event.id = items[i].id,
          event.title = items[i].summary,
          event.start =  items[i].start.dateTime,
          event.end =  items[i].end.dateTime;
          if(!event.start){//all day event
            event.start = items[i].start.date,
            event.end =  items[i].end.date
          }
          events.push(event);
        };
        console.log(events);
        $('#calendar').fullCalendar('renderEvents' , events,true);
      }
    };
  })();
  //update an existing event
  function updateEvent(event) {
    var desc;
    var location;
    var eventToSave = {};
    if (event.placeID) {
        location = event.placeID; // formatted address for gCal
        // placeID is handled on google's end
    }
    if (event.description) {
        desc = event.description;
    }
    if (event.allDay) {
        eventToSave = {
            'summary': event.title,
            'location': location,
            'description': desc,
            'start': {
                'date': event.start.format("YYYY-MM-DD")
            },
            'end': {
                'date': event.end.format("YYYY-MM-DD")
            }
        };

    } else {
        eventToSave = {
            'summary': event.title,
            'location': location,
            'description': desc,
            'start': {
                'dateTime': event.start.local() ,
            },
            'end': {
                'dateTime': event.end.local(),
            }
        };
    }
    console.log(eventToSave);
    var request = gapi.client.calendar.events.update({
        'calendarId': 'primary',
        'eventId':event.id,
        'resource': eventToSave
    });
    request.execute(function(response) {
        if (!response) {
            console.log('error updating event');
            console.log(response);
        } else {
            console.log('event updated');
            console.log(response);
            $('#calendar').fullCalendar('updateEvent', event); // stick? = true                         
        }
    });
  }
  // saves event to eventArray 
  // used for both intial save and 
  // later edits to the event
  function insertEvent(event) {
    var desc;
    var location;
    var eventToSave = {};
    if (event.placeID) {
        location = event.placeID; // formatted address for gCal
        // placeID is handled on google's end
    }
    if (event.description) {
        desc = event.description;
    }
    if (event.allDay) {
        eventToSave = {
            'summary': event.title,
            'location': location,
            'description': desc,
            'start': {
                'date': event.start.format("YYYY-MM-DD")
            },
            'end': {
                'date': event.end.format("YYYY-MM-DD")
            }
        };

    } else {
        eventToSave = {
            'summary': event.title,
            'location': location,
            'description': desc,
            'start': {
                'dateTime': event.start.local() ,
            },
            'end': {
                'dateTime': event.end.local(),
            }
        };
    }
    console.log(eventToSave);
    var request = gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': eventToSave
    });
    request.execute(function(response) {
        if (!response) {
            console.log('error inserting event');
            console.log(response);
        } else {
            console.log('event inserted');
            console.log(response);
            console.log(response.id);
            event.id = response.id;
            $('#calendar').fullCalendar('renderEvent', event,true); // stick? = true                         
        }
    });
  }
  // deletes event from users gcal
  // when it is dropped in the trashcan
  function deleteEvent(event) {
    var request = gapi.client.calendar.events.delete({
        'calendarId': 'primary',
        'eventId': event.id
    });

    request.execute(function(response) {
        if (!response) {
            console.log('event delete threw error');
            console.log(response);
        } else {
            console.log('event deleted');
            $('#calendar').fullCalendar('removeEvents', event.id);
        }
    });

  }