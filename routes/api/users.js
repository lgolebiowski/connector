const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

// Loading User model
const User = require('../../models/User')

//Load input validation
const validateRegisterInput = require('../../validation/register')

// GET api/users/register
// Register user
// Public
router.post('/register',(req, res) => {
  const { errors,isValid } = validateRegisterInput(req.body);
// Check validation
  if(!isValid){
    console.log('eeej')
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email })
  .then(user => {
    if(user) {
      errors.email = 'Email already exists'
      return res.status(400).json(errors);
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: '200', // avatar size
        r: 'pg', // rating
        d: 'mm' // default
       });
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if(err) throw err;
          newUser.password = hash;
          newUser.save()
           .then(user => res.json(user))
           .catch(err => console.log('hashError', err))
        })
      })
    }
  })
});

// GET api/users/login
// Login user
// Public
router.post('/login',(req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Find user by email
  User.findOne({email})
    .then(user => {
      if(!user) {return res.status(404).json({email: 'User not found'})}
    // Check the password
    bcrypt.compare(password, user.password)
      .then(isMatching => {
        if(isMatching) {
          // 
          const payload = { 
            id: user.id,
            name: user.name,
            avatar: user.avatar
          }

          jwt.sign(
            payload,
            keys.secretKey,
            {expiresIn: 3600},
            (err, token) => {
              res.json({
              success: true,
              token: 'Bearer ' + token
              })
            })
          // res.json({msg: 'Success'});
        } else {
          errors.password = 'Sorry buddy, password incorrect';
          return res.status(400).json(errors)
        }
      })
    })
    .catch()
});

// GET api/users/login
// Login user
// Public
router.get('/current',
passport.authenticate('jwt', {session: false}),
(req, res) => {
  res.json({id: req.user.id});
})


module.exports = router;

