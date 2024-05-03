var express = require('express');
var requestIp = require('request-ip');
//var mysql = require('mysql');
//var requestIp = require('request-ip');
//var cookieParser = require('cookie-parser');
var config = require('./config.js');

var router = express.Router();

//router.use(cookieParser('dsjgkksdfd'));
//router.use(cookieParser());

/*var connection = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database
});;*/

router.get('/password', function(req, res) {
    res.render('password.ejs', { });
    console.log(requestIp.getClientIp(req));
});

router.get('/', function(req, res) {
    res.render('index.ejs', { });
    console.log(requestIp.getClientIp(req));
});

router.get('/elements', function(req, res) {
    res.render('elements.ejs', { });
    console.log(requestIp.getClientIp(req));
});

router.get('/index', function(req, res) {
    res.render('index.ejs', { }); 
});

router.get('/calculator', function(req, res) {
    res.render('calculator.ejs', { });
});

router.get('/gallery', function(req, res) {
    res.render('gallery.ejs', { });
});

router.get('/memory', function(req, res) {
    res.render('memory.ejs', { });
});

router.get('/travel_journal', function(req, res) {
    res.render('travel_journal.ejs', { });
});

router.get('/travel_recommendations', function(req, res) {
    res.render('travel_recommendations.ejs', { });
});

router.get('/travel_statistics', function(req, res) {
    res.render('travel_statistics.ejs', { });
});

router.get('/travel_calendar', function(req, res) {
    res.render('travel_calendar.ejs', { });
});

router.get('/travel_test', function(req, res) {
    res.render('travel_test.ejs', { });
});

router.get('/translation', function(req, res) {
    res.render('translation.ejs', { });
});

router.get('/weather', function(req, res) {
    res.render('weather.ejs', { });
});

module.exports = router;