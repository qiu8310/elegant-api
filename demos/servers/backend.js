var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var express = require('express');
var app = express();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var USERS = require('../data/db').users;

app.get('/api/users/:uid', function (req, res) {
  var uid = req.params.uid;

  if (!uid || !(uid in USERS)) res.json({status: -1, message: 'User not found'});
  else res.json({status: 0, message: 'ok', data: USERS[uid]});
});

app.get('/api/users', function (req, res) {
  res.json({status: 0, message: 'ok', data: Object.keys(USERS).map(function (id) { return USERS[id]; })});
});


app.post('/api/users', function (req, res) {
  var data = req.body;
  var result = {status: -2, message: 'ok', data: null};
  if (!data.username) result.message = 'No username';
  else if (!data.age) result.message = 'No age';
  else if (!data.gender) result.message = 'No gender';
  else {
    result.status = 0;
    var user = {username: data.username, age: data.age, gender: data.gender};
    var uid = 0;
    while (++uid) if (!USERS[uid]) break;
    user.uid = uid;
    USERS[uid] = user;
    result.data = user;
  }

  res.json(result);
});


app.put('/api/users/:uid', function (req, res) {
  var data = req.body;
  var uid = req.params.uid, user;

  if (!uid || !(uid in USERS)) return res.json({status: -1, message: 'User not found'});

  user = USERS[uid];

  for (var key in user) {
    if (key in data && key !== 'uid') user[key] = data[key];
  }

  res.json({status: 0, message: 'ok', data: user});
});


app.delete('/api/users/:uid', function (req, res) {
  var uid = req.params.uid;
  if (!uid || !(uid in USERS)) res.json({status: -1, message: 'User not found'});
  else {
    user = USERS[uid];
    delete USERS[uid];
    res.json({status: 0, message: 'ok', data: user});
  }
});



app.listen(4000, function () {
  console.log('\nBackend server listen on localhost:4000\n');
});
