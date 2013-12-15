(function() {
  var JsonRenderer, User;

  User = require('../models/user');

  JsonRenderer = require('../lib/json_renderer');

  module.exports = function(app) {
    var login;
    app.post("/user", function(req, res) {
      var user;
      user = new User({
        email: req.body.email,
        password: User.hashPassword(req.body.password)
      });
      return user.save(function(err) {
        if (err) {
          console.error("Could not create user", err);
          res.statusCode = 409;
          return res.json({
            "error": "User cannot be created"
          });
        } else {
          return res.json(JsonRenderer.user(user));
        }
      });
    });
    app.post("/login", function(req, res, next) {
      return login(req, res, next);
    });
    app.put("/login", function(req, res, next) {
      return login(req, res, next);
    });
    app.get("/user/:id?", function(req, res) {
      if (!req.user) {
        res.statusCode = 409;
        return {};
      }
      return res.json(JsonRenderer.user(req.user));
    });
    app.get("/logout", function(req, res) {
      req.logout();
      return res.json({});
    });
    app.get("/generate_gauth", function(req, res) {
      if (!req.user) {
        res.statusCode = 409;
        return {};
      }
      return req.user.generateGAuthData(function() {
        return res.json(JsonRenderer.user(req.user));
      });
    });
    return login = function(req, res, next) {
      return passport.authenticate("local", function(err, user, info) {
        if (err) {
          res.statusCode = 401;
          return res.json({
            error: err
          });
        }
        if (!user) {
          res.statusCode = 401;
          return res.json({
            error: "Invalid credentials"
          });
        }
        return req.logIn(user, function(err) {
          if (err) {
            res.statusCode = 401;
            return res.json({
              error: "Invalid credentials"
            });
          }
          if (user.gauth_data && !user.isValidGAuthPass(req.body.gauth_pass)) {
            req.logout();
            res.statusCode = 401;
            return res.json({
              error: "Invalid Google Authenticator code"
            });
          }
          return res.json(JsonRenderer.user(req.user));
        });
      })(req, res, next);
    };
  };

}).call(this);
