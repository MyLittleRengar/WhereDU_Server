var express = require('express');
var express = require('express');
var mysql = require('mysql2');
var config = require('./config.js');

var router = express.Router();

//router.use(cookieParser('dsjgkksdfd'));
//router.use(cookieParser());

var connection = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
    database: config.database
});

router.get('/', function(req, res) {
    connection.query('SELECT * FROM member', function (error, rows) {
        connection.query('SELECT * FROM inquiry', function (error, row) {
            connection.query('SELECT * FROM promise', function (error, promise) {
                connection.query('SELECT * FROM event', function (error, event) {
                    connection.query('SELECT * FROM notice', function (error, notice) {
                        var boardCnt = event.length + notice.length;
                        var memberCnt = rows.length;
                        var inquiryCnt = row.length;
                        var promiseCnt = promise.length;
                        res.render('index.ejs', {
                            'boardCnt': boardCnt,
                            'promiseCnt': promiseCnt,
                            'inquiryCnt': inquiryCnt,
                            'memberCnt': memberCnt,
                            'rows': rows
                        });
                    });
                });
            });
        });
    });
    
});

router.get('/index', function(req, res) {
    res.render('index.ejs', { }); 
});

module.exports = router;