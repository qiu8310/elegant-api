var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var express = require('express');
var app = express();

app.use(function (req, res, next) {
  res.append('Access-Control-Allow-Origin', '*');
  next();
});

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var USERS = require('../data/db').users;

app.all('*', function (req, res, next) {
  console.log(req.url);
  next();
});

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
  if (!data.user_name) result.message = 'No user_name';
  else if (!data.user_age) result.message = 'No user_age';
  else if (!data.sex) result.message = 'No sex';
  else {
    result.status = 0;
    var user = {user_name: data.user_name, user_age: data.user_age, sex: data.sex};
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



app.listen(4100, function () {
  console.log('\nBackend server listen on localhost:4100\n');
});
