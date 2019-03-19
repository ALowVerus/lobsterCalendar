function appendAtId(id, innerHtml) {
  document.getElementById(id).innerHTML += innerHtml;
}

chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
  console.log('token', token);

  const headers = new Headers({
      'Authorization' : 'Bearer ' + token,
      'Content-Type': 'application/json'
  })

  const queryParams = { headers };
  const api_url = 'https://www.googleapis.com/calendar/v3'

  // Test storage capabilities
  chrome.storage.sync.set(
    {
      'trackedObjects': [
        {
          "title": "Work Out",
          "startDatetime": new Date("January 1, 2019").toISOString(),
          "endDatetime": new Date("March 1, 2019").toISOString()
        },
        {
          "title": "Dinner",
          "startDatetime": new Date("February 1, 2019").toISOString(),
          "endDatetime": new Date("March 1, 2019").toISOString()
        }
      ]
    }, function() { console.log('Settings saved'); }
  );
  chrome.storage.sync.get(['trackedObjects'], function(result) {
    var trackedObjects = result['trackedObjects'];
    for (var i = 0; i < trackedObjects.length; i ++) {
      var trackedObject = trackedObjects[i];
      appendAtId('chromeHeldPreferences', '<p>' + trackedObject['title'] + ' starts at ' + trackedObject['startDatetime'] + ' and ends at ' + trackedObject['endDatetime']);
    }
    console.log(result);
  });


  // Get the primary calendar
  var url = new URL(api_url + '/users/me/calendarList');
  fetch(url, queryParams)
  .then((response) => response.json()) // Transform the data into json
  .then(function(data) {
    console.log(data);
    var calendarList = data["items"];
    var primaryCalendar;
    for (var i = 0; i < calendarList.length; i ++) {
      if (calendarList[i]['primary'] == true) {
        primaryCalendar = calendarList[i];
        appendAtId("calendarList", '<div class="col-12"><b>' + calendarList[i]['summary'] + '</b></div>');
      }
      else {
        appendAtId("calendarList", '<div class="col-12">' + calendarList[i]['summary'] + '</div>');
      }
    }
    console.log(primaryCalendar);

    // Get single calendar
    var url = new URL(api_url + '/calendars/' + primaryCalendar['id']);
    fetch(url, queryParams)
    .then((response) => response.json()) // Transform the data into json
    .then(function(data) {
      console.log(data);
      appendAtId('primaryCalendar', '<div class="col-12"><h4>Primary: ' + primaryCalendar['summary'] + '</h4></div>');

      // Get all events from primaryCalendar
      var today = new Date();
      console.log(today);

      var url = new URL(api_url + '/calendars/' + primaryCalendar['id'] + '/events'),
          params = {
            singleEvents: true,
            orderby: "startTime",
            maxResults: 2500,
            timeMax: today.toISOString()
          }
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
      fetch(url, queryParams)
      .then((response) => response.json()) // Transform the data into json
      .then(function(data) {
        console.log(data);
        var events = data["items"]
        for (var i = 0; i < events.length; i ++) {
          appendAtId('primaryCalendar', '<div class="col-12">' + events[i]["summary"] + '</div>');
        }
      })
    })
  })
})
