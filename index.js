const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyparser = require('body-parser');
const mongoose = require('mongoose');

const User = require('./schemas').User;
const Exercise = require('./schemas').Exercise;

mongoose.connect(process.env.MONGO_URI)

app.use(cors())
app.use(express.static('public'))
app.use(bodyparser.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res, next) =>
{
  let doc = new User({
    username: req.body.username
  });
  doc.save().then((d) =>
  {
    res.json({ username: d.username, _id: d._id });
  }).catch((e) =>
  {
    console.error(e);
    res.json({ error: e.message });
  });
}) 

app.get('/api/users', (req, res, next) =>
{
  User.find().select('username').then((docs) =>
  {
    res.json(docs);
  }).catch((e) =>
  {
    console.error(e);
    res.json({ error: `user retrieval failed (${e.message})` });
  });
});

app.post('/api/users/:id/exercises', (req, res, next) =>
{
  let d = new Date(req.body.date);
  let exer = new Exercise({
    description: req.body.description,
    duration: req.body.duration,
    dateobj: (d.toString() == 'Invalid Date') ? Date.now() : d
  });
  console.log(req.body._id, req.body.id, req.params.id);
  User.findById(req.params.id).then((u) =>
  {
    if (u == null)
    {
      console.error('find by id failed');
      res.json({ error: "provided ID did not match any existing user" });
    } else
    {
      exer.username = u.username;
      u.log.push(exer);
      u.count = u.log.length
      u.save().then((doc) =>
      {
        console.log(`updated user ${u.username}: ${doc}`);
        res.json(exer);
      }).catch((e) =>
      {
        console.error(`encountered error ${e} while adding exercise log ${exer} to user ${u}`);
        res.json({ error: e.message });
      });
    }
  }).catch((err) =>
  {
    console.error(`find by id failed ${err}`);
    res.json({ error: err.message })
  });
});

app.get('/api/users/:id/logs', (req, res, next) =>
{
  User.findById(req.params.id).then((u) =>
  {
    if (u == null)
    {
      console.error(`error: u == null in logs endpoint findById call`);
      res.json({ error: 'no user found with that id' });
    } else if (req.query.from || req.query.to || req.query.limit)
    {
      let from = new Date(req.query.from);
      from = (from.toString() == 'Invalid Date') ? null : from;
      let to = new Date(req.query.to);
      to = (to.toString() == 'Invalid Date') ? Infinity : to;
      let lim = Number(req.query.limit);
      lim = (!lim) ? Infinity : lim;

      let arr = [];
      for (let ex of u.log)
      {
        if (ex.dateobj >= from && ex.dateobj <= to)
        {
          if (arr.length <= lim)
          {
            arr.push(ex);
          } else
          {
            break;
          }
        }
      }
      u.log = arr;
      res.json(u);
    } else
    {
      res.json(u);
    }
  }).catch((e) =>
  {
    console.error(`findById call in logs endpoint returned rejected promise (${e})`);
    res.json({ error: e.message });
  });
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
