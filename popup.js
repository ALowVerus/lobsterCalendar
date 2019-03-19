chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
  console.log('token', token);

  const headers = new Headers({
      'Authorization' : 'Bearer ' + token,
      'Content-Type': 'application/json'
  })

  const queryParams = { headers };
  const api_url = 'https://www.googleapis.com/calendar/v3'

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
        // document.getElementById("calendarList").innerHTML += '<div class="col-12"><b>' + calendarList[i]['summary'] + '</b></div>'
      }
      else {
        // document.getElementById("calendarList").innerHTML += '<div class="col-12">' + calendarList[i]['summary'] + '</div>'
      }
    }
    console.log(primaryCalendar);

    // Get single calendar
    var url = new URL(api_url + '/calendars/' + primaryCalendar['id']);
    fetch(url, queryParams)
    .then((response) => response.json()) // Transform the data into json
    .then(function(data) {
      console.log(data);
      // document.getElementById("primaryCalendar").innerHTML += '<div class="col-12"><h3>' + primaryCalendar['summary'] + '</h3><p>' + primaryCalendar['description'] + '</p></div>'

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
      })
    })
  })
})
