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
/*
//Search DB 갯수 리턴
router.post('/search', function (req, res, next) {
    var searchText = req.body.searchText;
    connection.query('SELECT * FROM car_list WHERE name Like ? OR phone Like ? OR carnumber Like ? OR workship Like ? OR department Like ? OR memo Like ? ORDER BY `car_list`.`name` ASC;',['%'+searchText+'%', '%'+searchText+'%', '%'+searchText+'%','%'+searchText+'%','%'+searchText+'%','%'+searchText+'%'], function(error, rows) {
        var dataLength = rows.length;
        res.send(dataLength.toString());
    }); 
});
*/
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

router.post('/friendListData', function (req, res, next) {
    var userNickname = req.body.userNickname;
    var friendInt = req.body.friendInt;
    connection.query('SELECT * FROM friend_list WHERE ownerNickname=?', [userNickname], function (error, rows) {
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

router.post('/returnFriendCount', function (req, res, next) {
    var userNickname = req.body.userNickname;
    connection.query('SELECT * FROM friend_list WHERE ownerNickname=?', [userNickname], function (error, rows) {
        if(error) console.log(error)
        var dataCnt = rows.length.toString();
        res.send(dataCnt);
    });
});

/*
갯수를 바탕으로 리사이클러에 데이터 추가
router.post('/addTravelRecyclerList', function (req, res, next) {
    var travelCnt = req.body.travelCnt;
    connection.query('SELECT * FROM travelCalendar;', function (error, rows) {
        res.send(rows[travelCnt]);
    });
});
*/

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
    var friendBookMark = ""
    connection.query('INSERT INTO friend_list (friendNickname, ownerNickname, friendBookMark) VALUES(?,?,?)', [friendNickname, userNickname, friendBookMark], function (error, data) {
        if(error) console.log(error)
        res.send("pass");
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

//데이터 수정
router.post('/changeData', function (req, res, next) {
    var ownNum = req.body.ownNum;
    var changeType = req.body.changeType;
    var changeDate = req.body.changeDate;
    var changeLoc = req.body.changeLoc;
    var changePerson = req.body.changePerson;
    //console.log(ownNum+changeType+changeDate+changeLoc+changePerson);
    connection.query('UPDATE travelCalendar SET calType= ?, calDate=?, calLoc=?, calPer=? WHERE calTime= ?', [changeType, changeDate, changeLoc, changePerson, ownNum], function (error, results) {
        if (error) console.table(error);
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

//회원 탈퇴
router.post('/unregister', function (req, res, next) {
    var userID = req.body.userID;
    connection.query('DELETE FROM member WHERE userid = ?', [userID], function(error, results) {
        if(error) console.table(error);
        res.send("pass");
    }); 
});

module.exports = router;