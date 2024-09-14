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
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
