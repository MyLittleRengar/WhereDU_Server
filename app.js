var express = require('express');

var webRouter = require('./web/webAdapter');
var appRouter = require('./app/appAdapter');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

var port = app.listen(process.env.PORT || 5050);

app.use(cookieParser('qwcasdnvlasdj'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

app.use(express.static('public'));

//app.use('/', webRouter);
app.use('/app', appRouter);

app.listen(port, function() {
    console.log("서버 실행");
});