var express = require('express');
var mysql = require('mysql2');
var config = require('./config.js');

const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

var router = express.Router();

var connection = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
    database: config.database
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        var userNick = req.body.userNick;
        var filename = userNick + path.extname(file.originalname);
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

// 이미지를 업로드하는 라우트
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.send('444'); // 파일이 업로드되지 않은 경우 처리
    }

    // 이미지 용량 확인
    const fileSize = req.file.size;
    if (fileSize > 50 * 1024) { // 50KB보다 클 경우 이미지 압축
        sharp(req.file.path)
            .resize({ width: 1024 }) // 이미지 리사이징
            .toFile(req.file.path.replace(/\.([^.]+)$/, '_compressed.$1'), (err, info) => {
                if (err) {
                    return res.status(500).send('Failed to compress image');
                }
                // 압축된 이미지를 업로드 폴더에 저장
                fs.renameSync(req.file.path.replace(/\.([^.]+)$/, '_compressed.$1'), req.file.path);
                res.send('111');
            });
    } else {
        res.send('111'); // 용량이 50KB 이하인 경우 그대로 저장
    }
});

router.get('/downloadImage', (req, res) => {
    const userNick = req.query.userNick;
    
    const imagePath = 'uploads/'+userNick+'.jpg'; 
    res.sendFile(path.resolve(imagePath));
});

router.post('/contest', function (req, res, next) {
    connection.connect(function (err) {
        if (err) {
            res.send("conFail");
            throw err;
        }
        else {
            res.send("conPass");
        }

    });
});

router.post('/addPromise', function (req, res, next) {
    var promiseOwner = req.body.promiseOwner;
    var promiseName = req.body.promiseName;
    var promiseLatitude = req.body.promiseLatitude;
    var promiseLongitude = req.body.promiseLongitude;
    var promisePlace = req.body.promisePlace;
    var promisePlaceDetail = req.body.promisePlaceDetail;
    var promiseDate = req.body.promiseDate;
    var promiseTime = req.body.promiseTime;
    var promiseMember = req.body.promiseMember.join(', ');
    var promiseMemo = req.body.promiseMemo;
    if(promiseMemo == null) {
        connection.query('INSERT INTO promise (promiseOwner, promiseName, promiseLatitude, promiseLongitude, promisePlace, promisePlaceDetail, promiseDate, promiseTime, promiseMember, promiseMemo) VALUES(?,?,?,?,?,?,?,?,?,?)', [promiseOwner, promiseName, promiseLatitude, promiseLongitude, promisePlace, promisePlaceDetail, promiseDate,promiseTime, null], function (error, data) {
            if(error){
                console.log(error);
                res.send("nameFail");
            }
            else {
                res.send("pass");
            }
        });
    }
    else {
        connection.query('INSERT INTO promise (promiseOwner, promiseName, promiseLatitude, promiseLongitude, promisePlace, promisePlaceDetail, promiseDate, promiseTime, promiseMember, promiseMemo) VALUES(?,?,?,?,?,?,?,?,?,?)', [promiseOwner, promiseName, promiseLatitude, promiseLongitude, promisePlace, promisePlaceDetail, promiseDate, promiseTime, promiseMember, promiseMemo], function (error, data) {
            if(error){
                console.log(error);
                res.send("nameFail");
            }
            else {
                res.send("pass");
            }
        });
    }
});

router.post('/getUserData', function (req, res, next) {
    var userId = req.body.userId;
    connection.query('SELECT * FROM member WHERE userID=?', [userId], function (error, rows) {
        res.send(rows[0].userNickname);
    });
});

router.post('/findId', function (req, res, next) {
    var findNickname = req.body.findNickname;
    var findBirth = req.body.findBirth;
    connection.query('SELECT * FROM member WHERE userNickname=?', [findNickname], function (error, rows) {
        if (rows.length != 0) {
            var originalDate = new Date(rows[0].userBirth);
            originalDate.setDate(originalDate.getDate());
            const year = originalDate.getFullYear();
            const month = String(originalDate.getMonth() + 1).padStart(2, '0');
            const day = String(originalDate.getDate()).padStart(2, '0');
            const formattedDateString = `${year}-${month}-${day}`;
            if(findBirth == formattedDateString) {
                res.send("pass="+rows[0].userID+"/"+formattedDateString);
            }
            else {
                res.send("birthFail");
            }
        }
        else {
            res.send("nickFail");
        }
    });
});

router.post('/login', function (req, res, next) {
    var userID = req.body.userId;
    var userPW = req.body.userPw;
    connection.query('SELECT * FROM member WHERE userID=?', [userID], function (error, rows) {
        if (rows.length != 0) {
            if (userPW == rows[0].userPW) {
                res.send("pass");
            }
            else {
                res.send("pwFail");
            }
        }
        else {
            res.send("idFail");
        }
    });
});

router.post('/idCheck', function (req, res, next) {
    var userID = req.body.userId;
    connection.query('SELECT * FROM member WHERE userid=?', [userID], function (error, rows) {
        if (rows.length <= 0) {
            res.send("pass");
        }
        else {
            res.send("idFail");
        }
    });
});

router.post('/forgetPw', function (req, res, next) {
    var inputId = req.body.inputId;
    var inputBirth = req.body.inputBirth;

    connection.query('SELECT * FROM member WHERE userID=?', [inputId], function (error, rows) {
        if (rows.length != 0) {
            var originalDate = new Date(rows[0].userBirth);
            originalDate.setDate(originalDate.getDate());
            const year = originalDate.getFullYear();
            const month = String(originalDate.getMonth() + 1).padStart(2, '0');
            const day = String(originalDate.getDate()).padStart(2, '0');
            const formattedDateString = `${year}-${month}-${day}`;
            if(inputBirth == formattedDateString) {
                res.send("pass");
            }
            else {
                res.send("birthFail");
            }
        }
        else {
            res.send("idFail");
        }
    });
});

router.post('/promiseFriendListData', function (req, res, next) {
    var userNickname = req.body.userNickname;
    var friendInt = req.body.friendInt;
    connection.query('SELECT * FROM friend_list WHERE ownerNickname=?', [userNickname], function (error, rows) {
        if(error) console.log(error)
        var data = rows[friendInt].friendNickname;
        res.send(data);
    });
});

router.post('/friendListData', function (req, res, next) {
    var userNickname = req.body.userNickname;
    var friendInt = req.body.friendInt;
    connection.query('SELECT * FROM friend_list WHERE ownerNickname=? AND friendBookMark IS NULL', [userNickname], function (error, rows) {
        if(error) console.log(error)
        var data = rows[friendInt].friendNickname;
        res.send(data);
    });
});

router.post('/bookmarkFriendListData', function (req, res, next) {
    var userNickname = req.body.userNickname;
    var friendInt = req.body.friendInt;
    connection.query('SELECT * FROM friend_list WHERE ownerNickname=? AND friendBookMark IS NOT NULL', [userNickname], function (error, rows) {
        if(error) console.log(error)
        var data = rows[friendInt].friendNickname;
        res.send(data);
    });
});

router.post('/nicknameCheck', function (req, res, next) {
    var userNickname = req.body.userNickname;
    connection.query('SELECT * FROM member WHERE userNickname=?', [userNickname], function (error, rows) {
        if(error) console.log(error)
        if (rows.length <= 0) {
            res.send("pass");
        }
        else {
            res.send("NickFail");
        }
    });
});

router.post('/returnPromiseFriendCount', function (req, res, next) {
    var userNickname = req.body.userNickname;
    connection.query('SELECT * FROM friend_list WHERE ownerNickname=?', [userNickname], function (error, rows) {
        if(error) console.log(error)
        var dataCnt = rows.length.toString();
        res.send(dataCnt);
    });
});



router.post('/returnFriendCount', function (req, res, next) {
    var userNickname = req.body.userNickname;
    connection.query('SELECT * FROM friend_list WHERE ownerNickname=? AND friendBookMark IS NULL ', [userNickname], function (error, rows) {
        if(error) console.log(error)
        var dataCnt = rows.length.toString();
        res.send(dataCnt);
    });
});

router.post('/returnBookMarkFriendCount', function (req, res, next) {
    var userNickname = req.body.userNickname;
    connection.query('SELECT * FROM friend_list WHERE ownerNickname=? AND friendBookMark IS NOT NULL ', [userNickname], function (error, rows) {
        if(error) console.log(error)
        var dataCnt = rows.length.toString();
        res.send(dataCnt);
    });
});

router.post('/friendBookMarkChange', function (req, res, next) {
    var check = req.body.check;
    var friendNickname = req.body.friendNickname;
    var userNickname = req.body.userNickname;
    if(check == "true") {
        connection.query('UPDATE friend_list SET friendBookMark = ? WHERE friendNickname=? AND ownerNickname=?', ["0", friendNickname,userNickname], function (error, results) {
            if (error) console.table(error);
            res.send("AddPass")
        });
    }
    else {
        connection.query('UPDATE friend_list SET friendBookMark = NULL WHERE friendNickname=? AND ownerNickname=?', [friendNickname,userNickname], function (error, results) {
            if (error) console.table(error);
            res.send("NullPass")
        });
    }
});

router.post('/searchText', function (req, res, next) {
    var searchText = req.body.searchText;
    var userNickname = req.body.userNickname;
    connection.query('SELECT friendNickname FROM friend_list WHERE ownerNickname=? AND friendNickname Like ?', [userNickname, '%'+searchText+'%'], function (error, rows) {
        if (rows.length != 0) {
            res.send(rows)
        }
        else {
            res.send("NoData");
        }
    });
});

router.post('/friendAdd', function (req, res, next) {
    var userNickname = req.body.userNickname;
    var friendNickname = req.body.friendNickname;
    connection.query('SELECT * FROM member WHERE userNickname=?', [userNickname], function (error, row) {
        if(error) console.log(error);
        if(row != 0) {
            connection.query('SELECT * FROM friend_list WHERE ownerNickname=? AND friendNickname=?', [userNickname, friendNickname], function (error, rows) {
                if(error) console.log(error);
                if(rows.length != 0) {
                    connection.query('INSERT INTO friend_list (friendNickname, ownerNickname, friendBookMark) VALUES(?,?,NULL)', [friendNickname, userNickname], function (error, data) {
                        if(error) console.log(error);
                        res.send("pass");
                    });
                }
                else {
                    res.send("friendFail");
                }
            });
        }
        else {
            res.send("nicknameFail");
        }

    });
});

router.post('/userInfo', function (req, res, next) {
    var userID = req.body.userID;
    connection.query('SELECT * FROM member WHERE userid=?', [userID], function (error, rows) {
        var userName = rows[0].username;
        var usertravelCnt = rows[0].travelcnt.toString();
        var sendData = userName + "," + usertravelCnt;
        res.send(sendData);
    });
});

router.post('/changePw', function (req, res, next) {
    var userId = req.body.userId;
    var changePw = req.body.changePw;
    connection.query('UPDATE member SET userPW=? WHERE userID=?', [changePw, userId], function (error, rows) {
        res.send("pass");
    });
});

//유저데이터 등록
router.post('/addUser', function (req, res, next) {
    var addId = req.body.addId;
    var addPw = req.body.addPw;
    var addNickname = req.body.addNickname;
    var addGender = req.body.addGender;
    var addBirth = req.body.addBirth;
    connection.query('INSERT INTO member (userID, userPW, userNickname, userGender, userBirth) VALUES(?,?,?,?,?)', [addId, addPw, addNickname, addGender, addBirth], function (error, data) {
        if(error) console.log(error)
        res.send("pass");
    });
});

router.post('/friendDelete', function (req, res, next) {
    var friendNickname = req.body.friendNickname;
    var userNickname = req.body.userNickname;
    connection.query('DELETE FROM friend_list WHERE friendNickname=? AND ownerNickname=?', [friendNickname, userNickname], function(error, results) {
        if(error) console.table(error);
        res.send("pass");
    }); 
});

router.post('/returnPromiseData', function (req, res, next) {
    var promiseName = req.body.promiseName;
    connection.query('SELECT promiseName, promisePlace, promisePlaceDetail, promiseDate, promiseTime, promiseMember, promiseMemo FROM promise WHERE promiseName =?', [promiseName], function (error, rows) {
        res.send(rows);
    });
});

router.post('/calendarPromiseData', function (req, res, next) {
    connection.query('SELECT promiseDate FROM promise', function (error, rows) {
        res.send(rows);
    });
});

router.post('/selectPromiseData', function (req, res, next) {
    var promiseDate = req.body.promiseDate;
    var cnt = req.body.cnt;
    connection.query('SELECT promiseName, promisePlace, promisePlaceDetail, promiseDate, promiseTime, promiseMember, promiseMemo FROM promise WHERE promiseDate=?',[promiseDate], function (error, rows) {
        if(rows.length <= 0) {
            res.send("noData")
        }
        else {
            res.send(rows[cnt]);
        }
    });
});

router.post('/returnSelectPromiseData', function (req, res, next) {
    var promiseDate = req.body.promiseDate;
    connection.query('SELECT promiseName FROM promise WHERE promiseDate=?',[promiseDate], function (error, rows) {
        if(rows.length <= 0) {
            res.send("noData");
        }
        else {
            var dataCnt = rows.length.toString();
            res.send(dataCnt);
        }
    });
});

router.post('/recentPromise', function (req, res, next) {
    var userName = req.body.userName;
    connection.query(`SELECT promiseName, promisePlace, promiseTime, promiseDate, promiseLatitude, promiseLongitude FROM promise WHERE (promiseMember Like ? OR promiseOwner = ?) AND STR_TO_DATE(CONCAT(promiseDate, ' ', promiseTime), '%Y.%m.%d %H:%i') >= NOW() ORDER BY STR_TO_DATE(CONCAT(promiseDate, ' ', promiseTime), '%Y.%m.%d %H:%i') ASC LIMIT 1;`, ['%'+userName+'%', userName], function (error, rows) {
        if (rows.length <= 0) {
            res.send("noData");
        } else {
            res.send(rows);
        }
    });
    
});

router.post('/pastPromise', function (req, res, next) {
    var userName = req.body.userName;
    var cnt = req.body.cnt;
    connection.query(`SELECT promiseName, promiseMember, promiseTime, promiseDate FROM promise WHERE (promiseMember LIKE ? OR promiseOwner = ?) AND STR_TO_DATE(CONCAT(promiseDate, ' ', promiseTime), '%Y.%m.%d %H:%i') < NOW() ORDER BY STR_TO_DATE(CONCAT(promiseDate, ' ', promiseTime), '%Y.%m.%d %H:%i') ASC;`, ['%'+userName+'%', userName], function (error, rows) {
        if(rows.length <= 0) {
            res.send("noData")
        }
        else {
            res.send(rows[cnt]);
        }
    });
});

router.post('/returnPastPromise', function (req, res, next) {
    var userName = req.body.userName;
    connection.query(`SELECT promiseName FROM promise WHERE (promiseMember LIKE ? OR promiseOwner = ?) AND STR_TO_DATE(CONCAT(promiseDate, ' ', promiseTime), '%Y.%m.%d %H:%i') < NOW() ORDER BY STR_TO_DATE(CONCAT(promiseDate, ' ', promiseTime), '%Y.%m.%d %H:%i') ASC;`, ['%'+userName+'%', userName], function (error, rows) {
        if (rows.length <= 0) {
            res.send("noData");
        } else {
            var dataCnt = rows.length.toString();
            res.send(dataCnt);
        }
    });
});

router.post('/eventData', function (req, res, next) {
    var event = req.body.event;
    connection.query(`SELECT eventTitle, eventStartDate, eventEndDate FROM event;`, function (error, rows) {
        if(rows.length <= 0) {
            res.send("noData")
        }
        else {
            res.send(rows[event]);
        }
    });
});

router.post('/returnEventData', function (req, res, next) {
    connection.query(`SELECT * FROM event;`, function (error, rows) {
        if (rows.length <= 0) {
            res.send("noData");
        } else {
            var dataCnt = rows.length.toString();
            res.send(dataCnt);
        }
    });
});

router.post('/eventInfoData', function (req, res, next) {
    var eventTitle = req.body.eventTitle;
    connection.query(`SELECT * FROM event WHERE eventTitle=?;`,[eventTitle], function (error, rows) {
        res.send(rows);
    });
});


router.post('/noticeData', function (req, res, next) {
    var notice = req.body.notice;
    connection.query(`SELECT noticeTitle, noticeDate FROM notice;`, function (error, rows) {
        if(rows.length <= 0) {
            res.send("noData")
        }
        else {
            res.send(rows[notice]);
        }
    });
});

router.post('/returnNoticeData', function (req, res, next) {
    connection.query(`SELECT * FROM notice;`, function (error, rows) {
        if (rows.length <= 0) {
            res.send("noData");
        } else {
            var dataCnt = rows.length.toString();
            res.send(dataCnt);
        }
    });
});

router.post('/noticeInfoData', function (req, res, next) {
    var noticeTitle = req.body.noticeTitle;
    connection.query(`SELECT * FROM notice WHERE noticeTitle=?;`,[noticeTitle], function (error, rows) {
        res.send(rows);
    });
});

router.post('/inquiry', function (req, res, next) {
    var nickname = req.body.nickname;
    var date = req.body.date;
    var content = req.body.content;
    connection.query('INSERT INTO inquiry (inquiryNickname, inquiryDate, inquiryContent) VALUES(?,?,?)', [nickname, date, content], function (error, data) {
        res.send("pass");
    });
});

router.post('/unregister', function (req, res, next) {
    var userNickname = req.body.userNickname;
    connection.query('DELETE FROM member WHERE userNickname  = ?', [userNickname], function(error, results) {
        if(error) console.table(error);
        connection.query('DELETE FROM friend_list WHERE ownerNickname = ? OR friendNickname=?;', [userNickname, userNickname], function(errors, results) {
            if(errors) console.table(errors);
            res.send("pass");
        });
    }); 
});

router.post('/deletePromise', function (req, res, next) {
    var promiseName = req.body.name;
    connection.query('DELETE FROM promise WHERE promiseName = ?;', [promiseName], function(error, results) {
        if(error) {console.log(error);}
        else { res.send("pass"); }
    }); 
});

router.post('/inquiry', function (req, res, next) {
    var nickname = req.body.nickname;
    var date = req.body.date;
    var content = req.body.content;
    connection.query('INSERT INTO inquiry (inquiryTitle, inquiryDate, inquiryContent) VALUES(?,?,?);', [nickname, date, content], function (error, data) {
        res.send("pass");
    });
});

router.post('/location', function (req, res, next) {
    var nickname = req.body.nickname;
    var longitude = req.body.longitude
    var latitude = req.body.latitude;
    connection.query(`SELECT * FROM location WHERE nickname=?;`,[nickname], function (error, rows) {
        if(rows != null) {
            connection.query('UPDATE INTO location (nickname, longitude, latitude) VALUES(?,?,?);', [longitude, latitude, nickname], function (error, data) {
                res.send("pass");
            });
        }
        else {
            connection.query('INSERT location SET longitude=?, latitude=? WHERE nickname=?;', [nickname, longitude, latitude], function (error, data) {
                res.send("pass");
            });
        }
    });
    
});

router.post('/memberLocation', function (req, res, next) {
    var nickname = req.body.nickname;
    connection.query(`SELECT * FROM location WHERE nickname=?;`,[nickname], function (error, rows) {
        res.send(rows);
    });
});

router.post('/memberTouchdown', function (req, res, next) {
    var promiseName = req.body.promiseName;
    var nickname = req.body.nickname;
    connection.query(`SELECT nickname, touchdown FROM touchdown WHERE promiseName=? AND nickname=?;`,[promiseName,nickname], function (error, rows) {
        res.send(rows);
    });
});

router.post('/addTouchdown', function (req, res, next) {
    var promiseName = req.body.promiseName;
    var nickname = req.body.nickname;
    connection.query('INSERT INTO touchdown (promiseName, nickname, touchdown) VALUES(?,?,?)', [promiseName, nickname, 0], function (error, data) {
        res.send("pass");
    });
});

router.post('/changeTouchdown', function (req, res, next) {
    var promiseName = req.body.promiseName;
    var nickname = req.body.nickname;
    var touch = req.body.touchdown;
    connection.query('INSERT INTO touchdown (promiseName, nickname, touchdown) VALUES(?,?,?)', [promiseName, nickname, touch], function (error, data) {
        res.send("pass");
    });
});



module.exports = router;