/*
 * Code for Lobster Calendar, an interface to Google Calendar.
 * Written by Aidan Low.
 */


/* UTILITIES */

// Append code to HTML tag with given ID
function appendAtId(id, innerHtml) {
  document.getElementById(id).innerHTML += innerHtml;
}

// Clear a div's innerHTML
function clearAtId(id) {
  document.getElementById(id).innerHTML = "";
}

function saveItemToSync(key, value) {
  var obj = {};
  obj[key] = value;
  chrome.storage.local.set(
    obj, function() { console.log( key + ' saved.'); }
  );
}

// Set the value of a certain tracked objective
function setTrackedObjectValue(i, key, value) {
  chrome.storage.local.get(['trackedObjects'], function(result) {
    var trackedObjects = result['trackedObjects'];
    trackedObjects[i][key] = value;
    saveItemToSync('trackedObjects', trackedObjects)
  });
}


/* FUNCTIONS */

// Seed tasks
function seedPreferences() {
  saveItemToSync('trackedObjects', [
    {
      "title": "Test 1",
      "startDatetime": new Date("4 March 2019").toISOString(),
      "endDatetime": new Date("10 March 2019").toISOString()
    },
    {
      "title": "Test 2",
      "startDatetime": new Date("2 March 2019").toISOString(),
      "endDatetime": new Date("10 March 2019").toISOString()
    }
  ]);
  saveItemToSync('eventTypesList', [
    "Sleep", "School", "Downtime", "Comp/Exams", "Dating/Partner",
    "Social time", "Exercise", "Productive Time",
    "Gaming", "Family Time", "Travel", "Prep", "Waste Time",
    "Health", "Paid work"
  ])
  saveItemToSync('eventTypesDict', {
    "Sleep":                    {"color": "", "associatedEvents": [], "amount": 0},
    "School":                   {"color": "", "associatedEvents": [], "amount": 0},
    "Downtime":                 {"color": "", "associatedEvents": [], "amount": 0},
    "Comp/Exams":               {"color": "", "associatedEvents": [], "amount": 0},
    "Dating/Partner":           {"color": "", "associatedEvents": [], "amount": 0},
    "Social time": {"color": "", "associatedEvents": [], "amount": 0},
    "Exercise":                 {"color": "", "associatedEvents": [], "amount": 0},
    "Productive Time":          {"color": "", "associatedEvents": [], "amount": 0},
    "Gaming":                   {"color": "", "associatedEvents": [], "amount": 0},
    "Family Time":              {"color": "", "associatedEvents": [], "amount": 0},
    "Travel":                   {"color": "", "associatedEvents": [], "amount": 0},
    "Prep":                     {"color": "", "associatedEvents": [], "amount": 0},
    "Waste Time":               {"color": "", "associatedEvents": [], "amount": 0},
    "Health":                   {"color": "", "associatedEvents": [], "amount": 0},
    "Paid work":                {"color": "", "associatedEvents": [], "amount": 0}
  })
}

// Render a list of all tracked tasks
function renderTrackedObjects() {
  clearAtId('chromeHeldPreferences');
  chrome.storage.local.get(['trackedObjects'], function(result) {
    var trackedObjects = result['trackedObjects'];
    for (var i = 0; i < trackedObjects.length; i ++) {
      var trackedObject = trackedObjects[i];
      appendAtId('chromeHeldPreferences', '<p>' + trackedObject['title'] + ' starts at ' + trackedObject['startDatetime'] + ' and ends at ' + trackedObject['endDatetime']);
    }
    console.log(result);
  });
}

// Render the calendarList
function renderCalendarList() {
  clearAtId('primaryCalendar');
  clearAtId('calendarList');
  chrome.storage.local.get(['calendarList'], function(result) {
    var calendarList = result['calendarList'];
    for (var i = 0; i < calendarList.length; i ++) {
      if (calendarList[i]['primary'] == true) {
        var primaryCalendar = calendarList[i];
        saveItemToSync('primaryCalendar', primaryCalendar);
        appendAtId('primaryCalendar', '<div class="col-12"><h4>Primary: ' + primaryCalendar['summary'] + '</h4></div>');
        appendAtId("calendarList", '<div class="col-12"><b>' + calendarList[i]['summary'] + '</b></div>');
      }
      else {
        appendAtId("calendarList", '<div class="col-12">' + calendarList[i]['summary'] + '</div>');
      }
    }
  })
}

// Pull the calendarList
function pullCalendarList(api_url, queryParams) {
  var url = new URL(api_url + '/users/me/calendarList');
  fetch(url, queryParams)
  .then((response) => response.json()) // Transform the data into json
  .then(function(data) {
    console.log(data);
    var calendarList = data["items"];
    saveItemToSync('calendarList', calendarList);
    console.log(primaryCalendar);
  })
}

function renderEventTypes() {
  clearAtId('eventTypes')
  chrome.storage.local.get(['eventTypesList'], function(result) {
    var eventTypesList = result['eventTypesList'];
    chrome.storage.local.get(['eventTypesDict'], function(result) {
      var eventTypesDict = result['eventTypesDict'];
      appendAtId('eventTypes', '<div class="col-12"><h4>Event Types:</h4></div>');
      appendAtId('eventTypes', '<ul class="list-group">');
      for (var i = 0; i < eventTypesList.length; i ++) {
        var eventTypeName = eventTypesList[i];
        var eventType = eventTypesDict[eventTypeName];
        appendAtId('eventTypes', '<li class="list-group-item">' + eventTypeName + '</li>');
      }
      appendAtId('eventTypes', '</ul>');
    });
  });
}

// Render a list of all events at the bottom of the window
function renderAllEvents() {
  clearAtId('primaryCalendarEvents')
  chrome.storage.local.get(['events'], function(result) {
    var events = result['events'];
    for (var i = 0; i < events.length; i ++) {
      appendAtId('primaryCalendarEvents', '<div class="col-12">' + events[i]["summary"] + '</div>');
    }
  });
}

function pullAllEvents(api_url, queryParams) {
  var url = new URL(api_url + '/calendars/' + primaryCalendar['id'] + '/events'),
      params = {
        singleEvents: true,
        orderby: "startTime",
        maxResults: 2500,
        timeMax: new Date().toISOString()
      }
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
  fetch(url, queryParams)
  .then((response) => response.json()) // Transform the data into json
  .then(function(data) {
    console.log(data);
    var events = data["items"]
    saveItemToSync("events", events);
  })
}


/* MAIN */

chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
  console.log('token', token);

  const headers = new Headers({
      'Authorization' : 'Bearer ' + token,
      'Content-Type': 'application/json'
  })

  const queryParams = { headers };
  const api_url = 'https://www.googleapis.com/calendar/v3'

  // Seed and render objects
  seedPreferences();
  renderTrackedObjects();

  // Render calendarList
  renderCalendarList();
  // // Render saved events
  // renderAllEvents();
  // Render event types
  renderEventTypes();

  // Refresh calendarList
  pullCalendarList(api_url, queryParams);
  renderCalendarList();
  // // Refresh events
  // pullAllEvents(api_url, queryParams);
  // renderAllEvents();
})
