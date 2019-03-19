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
  saveItemToSync('colorMeanings', {

  })
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

// Main
chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
  console.log('token', token);

  const headers = new Headers({
      'Authorization' : 'Bearer ' + token,
      'Content-Type': 'application/json'
  })

  const queryParams = { headers };
  const api_url = 'https://www.googleapis.com/calendar/v3'

  // Seed and render objects
  // seedTrackedObjects();
  renderTrackedObjects();

  // Render calendarList
  renderCalendarList();

  // Render saved events
  renderAllEvents();

  // Get the primary calendar
  var url = new URL(api_url + '/users/me/calendarList');
  fetch(url, queryParams)
  .then((response) => response.json()) // Transform the data into json
  .then(function(data) {
    console.log(data);
    var calendarList = data["items"];
    saveItemToSync('calendarList', calendarList);
    console.log(primaryCalendar);
  })
  renderCalendarList();


  // Get all events from primaryCalendar
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
  renderAllEvents();
})
