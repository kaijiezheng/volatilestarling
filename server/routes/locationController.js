var Location = require('../models/locationModel');
var User = require('../models/userModel');
var Q = require('q');
var cheerio = require('cheerio');

module.exports = {
  retrieveData: function (req, res, next) {
    var username = req.body.username;
    var city = req.body.city;
    var country = req.body.country;

    var url = 'http://travel.state.gov/content/passports/en/country/' + country.toLowerCase() + '.html';

    var findCity = Q.nbind(Location.findOne, Location);
    findCity({ city: city })
      .then(function (location) {
        if (!location) {
          next(new Error('Location does not exist'));
        } else {
          request(url, function(error, response, html){
            if(!error){
              var $ = cheerio.load(html);
              var data = {
                location: location,
                info: {}
              };

              for (var i = 1; i <= 6; i++) {
                var selector = '.quick_fact' + i;

                $(selector).filter(function () {
                  var content = $(this);
                  data[content.children().first().text()] = content.children().last().text();
                });
              }

              res.status(200).send(location);
            }
          });
        }
      })
      .fail(function (error) {
        next(error);
      });
  },
  addCity: function (req, res, next) {
    var place = req.body.place;
    var city = req.body.city;
    var country = req.body.country;
    var username = req.body.username;
    // need to fetch attractions from trip advisor api

    // need to add location to userSchema too
    var findUser = Q.nbind(User.findOne, User);
    var findCity = Q.nbind(Location.findOne, Location);

    findUser({ username: username })
      .then(function (user) {
        if (!user) {
          next(new Error('User does not exist'));
        } else {

          findCity({ city: city, country: country })
            .then(function (location) {
              var newLocation;
              if (!location) {
                var create = Q.nbind(Location.create, Location);
                newLocation = {
                  city: city,
                  country: country,
                  attractions: []
                };
                create(newLocation);
              }
              // double check model to see if we should query city and/or country
              if (!user.locations[place]) {
                user.locations[place] = [];
                // initialize attractions array only if location not already added
              }
              location = location ? newLocation : location;
              res.status(200).send(location);
            });
        }
      })
      .fail(function (error) {
        next(error);
      });
  }
};