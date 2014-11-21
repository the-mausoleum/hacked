'use strict';

// Import server modules
var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var path = require('path');
var debug = require('debug')('express');
var jwt = require('jwt-simple');
var session = require('express-session');

// Import database models
var models = require('./models');

// Import custom modules
var jwtauth = require('./lib/jwt-auth');
var Command = require('./lib/command');

// Initialize server
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.set('jwtTokenSecret', 'U1VQRVJfU0VDUkVUX0tFWQ==');

app.use(session({ secret: 'SUPER_SECRET_KEY' }))
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: 24 * 60 * 60 * 1000
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var router = express.Router();

router.route('/')
    .get([jwtauth], function (req, res) {
        app.locals.output = [];

        return res.render('index');
    });

router.route('/register')
    .get(function (req, res) {
        return res.render('register');
    })
    .post(function (req, res) {
        models.User.encryptPassword(req.body.password, function (hash) {
            models.User.build({
                username: req.body.username,
                password: hash
            })
            .save()
            .success(function (callback) {
                return res.redirect('/');
            })
            .error(function (error) {
                return res.json(error);
            });
        })
    });

router.route('/login')
    .get(function (req, res) {
        return res.render('login');
    })
    .post(function (req, res) {
        models.User.find({
            username: req.body.username
        }).success(function (user) {
            user.comparePassword(req.body.password, function (err, isMatch) {
                if (isMatch) {
                    var expires = new Date();
                    expires.setDate(expires.getDate() + 7);

                    var token = jwt.encode({
                        iss: user.username,
                        exp: expires
                    }, app.get('jwtTokenSecret'));

                    req.session.token = token;

                    return res.redirect('/');
                }

                return res.render('login');
            });
        });
    });

router.route('/execute')
    .post([jwtauth], function (req, res) {
        var command = new Command(req.body.command);

        return res.status(200).json({
            message: command.execute()
        });
    });

app.use('/', router);

io.on('connection', function (socket) {
    socket.emit('news', {
        hello: 'world'
    });

    socket.on('some event', function (data) {
        console.log(data);
    });
});

app.set('port', process.env.PORT || 3000);

models.sequelize.sync().success(function () {
    server.listen(app.get('port'), function () {
        debug('Express server listening on port ' + server.address().port);
    });
});
