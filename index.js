// index.js

// where your node app starts
// init project
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var dns = require('dns');
// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
const e = require('express');
app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});
app.use(express.urlencoded({ extended: true }));
let urlDatabase = {}; // Simulating a database for short URLs
let idCounter = 0; // Counter for generating short URLs
let userData = [];
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.get("/api/whoami", function (req, res) {
  console.log(req.ip);
  res.json({
    ipaddress: req.ip,
    language: req.headers['accept-language'],
    software: req.headers['user-agent']
  })
});

app.post("/api/shorturl", function (req, res) {
  // const parsedBody = bodyParser.json;
  console.log(req.body);
  const originalUrl = req.body.url;

  if (!/^https?:\/\//.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }
  try {
    const hostname = new URL(originalUrl).hostname;
    console.log(hostname);
    dns.lookup(hostname, (err) => {
      if (err) {
        return res.status(400).json({ error: "invalid url" });
      }
      const shortUrl = idCounter++;
      urlDatabase[shortUrl] = originalUrl; // Store the URL in the database
      res.json({
        original_url: originalUrl,
        short_url: shortUrl
      });
    })
  } catch (error) {
    return res.status(400).json({ error: "invalid url" });
  }
});
app.get("/api/shorturl/:shorturl", function (req, res) {
  const url = req.params.shorturl;
  const originUrl = urlDatabase[url];
  if (!originUrl) {
    return res.status(404).json({ error: "invalid url" });
  }
  res.redirect(originUrl);
});

app.post("/api/users", function (req, res) {
  const username = req.body.username;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  const user = { username: username, _id: new Date().getTime().toString() }; // Simulating an ID
  userData.push(user);
  res.json(user);
});
app.get("/api/users", function (req, res) {
  res.send(userData);
});

app.post("/api/users/:_id/exercises", function (req, res) {
  const userId = req.params._id;
  const user = userData.find(u => u._id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = req.body.date ? new Date(req.body.date) : new Date();

  const exercises = {
    username: user.username,
    _id: user._id,
    description: description,
    duration: duration,
    date: date.toDateString()
  };
  user.log = user.log || [];
  user.log.push({
    description: description,
    duration: duration,
    date: date
  })
  res.json(exercises);
});

app.get("/api/users/:_id/logs", function (req, res) {
  const _id = req.params._id;
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  const limit = parseInt(req.query.limit) || 0;

  const user = userData.find(u => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  let log = user.log || [];
  const countLogs = log.length;
  if (from) {
    log = log.filter(exercise => new Date(exercise.date) >= from);
  }
  if (to) {
    log = log.filter(exercise => new Date(exercise.date)<= to);
  }
  if (limit > 0) {
    log = log.slice(0, limit);
  }
  log = log.map(exercise => ({
    description: exercise.description,
    duration: exercise.duration,
    date: new Date(exercise.date).toDateString()
  }));
  
  res.json({
    username: user.username,
    count: countLogs,
    _id: user._id,
    log: log || []
  });
})

app.get("/api/:date?", (req, res) => {
  let date = req.params.date;
  let dateObj;

  if (!date) {
    dateObj = new Date();
  } else if (/^\d+$/.test(date)) {
    dateObj = new Date(parseInt(date));
  } else {
    dateObj = new Date(date);
  }

  if (isNaN(dateObj.getTime())) {
    return res.json({ error: "Invalid Date" });
  }

  res.json({
    unix: dateObj.getTime(),
    utc: dateObj.toUTCString()
  });
});
 


// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  console.log('Visit http://localhost:' + listener.address().port);
});
