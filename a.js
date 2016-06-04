process.env.TZ='Asia/Seoul'

var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var app = express();
var onoff_flag=0;
var flag1=0;
var pre_1=0;
var pre_3x,pre_3y,pre_3z=0;
//////////////////////////////////////////////////
var request=require("request");
var crypto=require('crypto');
var randomstring=require('randomstring');
var moment =require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

var api_key ='NCS5739FC7155501';
var api_secret ='257C4BBCB6AE64769EE3CD792EAA2F6C';
var timestamp=parseInt(moment(new Date()).tz('Asia/Seoul').valueOf()/1000);
var salt= randomstring.generate(30);
var signature = crypto.createHmac('md5',api_secret).update(timestamp+salt).digest('hex');
var extension =[{
type :'SMS',
     to : '01044436380',
     from : '01044436380',
     subject :'도난 상황 알림',
     text: '[Web 발신] NiNaNo\n 도난 방지 상황입니다'
}];

////////////////////////////////////////////

app.use(express.static('hompi'));
app.use(express.static('hompi/Demo'));
var Sequelize = require('sequelize');
var sequelize = new Sequelize('mysql', 'root', '1234',{
		//host: 'localhost',
dialect: 'mysql',
define: {
timestamps: false
}		
});

var db = {};
db.User = sequelize.define('user', {
phone_num: {
type: Sequelize.STRING,
unique: true,
defaultValue: '',
allowNull: false,
validate: {
len: [3, 20]
}
},
password: {
type: Sequelize.STRING,
defaultValue: '',
allowNull: false,
validate: {
len: [3, 20]
}
},
device: {
type: Sequelize.STRING,
defaultValue: '',
allowNull: false,
validate: {
len: [3, 20]
}
}
},{
instanceMethods: {
checkPassword: function(password) {
		       if (this.password === password) {
			       return true;
		       } else {
			       return false;
		       }
	       }
		 }
});
sequelize.sync();

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
secret:'hello',
resave: false,
saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
		done(null, user.id);
		});

passport.deserializeUser(function(id, done) {
		db.User.findById(id).then(function(user) {
			if (user) {
			done(null, user);
			} else {
			done(null, null);
			}
			});
		});

passport.use(new LocalStrategy({
usernameField: 'phone_num',
passwordField: 'password',
}, function(username, password, done) {
console.log(username, password);
db.User.findOne({
where: {
phone_num: username,
password: password
}
}).then(function(user) {
	if (user) {
	done(null, user);
	} else {
	done(null, false);
	}
	}).catch(function(err) {
		done(err,null);
		});
}));

app.route('/button').
get(function (req, res,next) {
		console.log('Accessing the secret section...\n');
		if (!req.user) {
			return res.redirect('/');
		//return res.send('로그인을 하고 오세요');
		}
		next();
		}).get(function(req, res, next) {
			res.sendFile(__dirname+'/hompi/button.html');
			}).post(function(req,res){
				var abc=req.body.onoffswitch;

			//	console.log(req.body.onoffswitch);
				if(abc=='true')
				{
					onoff_flag=1;
					console.log(onoff_flag);
				}
				if(abc=='false')
				{
					onoff_flag=0;
					console.log(onoff_flag);
				}
				res.send('success');
				})

app.route('/register')
.get(function(req, res, next) {
		if (req.user) {
		return res.send('이미 로그인 했음');
		}
		next();
		}).get(function(req, res, next) {
			res.sendFile(__dirname + '/hompi/register2.html');
			}).post(function(req, res, next) {
				var phone = req.body.phone_num;
				var password = req.body.password;
				var device = req.body.device;
				db.User.findOne({
where: {
phone_num: phone
}
}).then(function(user) {
	if (user) {
	return;
	} else {
	return db.User.create({
phone_num: phone,
password: password,
device :device
});
	}
	}).then(function(user) {
		if (user) {
		next();
		} else {
		res.send('이미 아이디가 존재함'); //경고창으로 바꾸고 싶음
		}
		}).catch(function(err) {
			next(err);
			})
}).post(passport.authenticate('local', {
successRedirect: '/button',
failureRedirect: '/register' //위에서 res.send해서 리다이렉트 될 일이 없음
}));

app.route('/')
.get(function(req, res, next) {
		console.log('in!');
		console.log(req.user);
		if (req.user) {
		return res.send('이미 로그인을 했음');
		}
		next();
		}).get(function(req, res, next) {
			res.sendFile(__dirname+'/hompi/Demo/index.html');
			}).post(passport.authenticate('local', {
successRedirect: '/button',
failureRedirect: '/'
}));
app.listen(3000, function () {
		console.log('Example app listening on port 3000!');
		});

///////////////////////
app.route('/chart')
.get(function (req,res,next){

	console.log('123');

});





////////////////////////////////////////////////////////////////
app.route('/notify')
.get(function(req,res,next){
		var ss=req._parsedOriginalUrl._raw.toString().split('?');
		var sss=ss[1].split('\t');
		var threshold=150*150;
		var total_acc =0;
		var total_gy =0;
		var total_dir=0;
		console.log('>>>>>onoff_flag'+onoff_flag);
		var flag_alarm=0;
		for(i=0; i<3; i++){
			total_acc+=sss[i]*sss[i]
		}
	
	
		var cur_1=Math.sqrt(total_acc);
		// flag 설정
		if(Math.abs(cur_1-pre_1) >50){
			flag_alarm=1;
		}
	
	
		pre_1=cur_1;
					
		if(flag1==0){
			flag1=1;
			flag_alarm=0;
			prev_3x=sss[6];
			prev_3y=sss[7];
			prev_3z=sss[8];
	
		}		

	///////////////////////////////////////////////////////////////////////////////////
		for(i=3; i<6; i++){
			total_gy+=sss[i]* sss[i];
		}
	

		if(total_gy > 15*15){
			console.log(">M>>>>>>");
			flag_alarm=1;
		}

       /////////////////////////////////////////////////////////
		total_dir+=(sss[6]-prev_3x)*(sss[6]-prev_3x);
		total_dir+=(sss[7]-prev_3y)*(sss[7]-prev_3y);
		total_dir+=(sss[8]-prev_3z)*(sss[8]-prev_3z);
		
		prev_3x=sss[6];
		prev_3y=sss[7];
		prev_3z=sss[8];
	
		if(total_dir > 35*35){
			console.log( '>3rd>');
			flag_alarm=1;
		}
		
	///////////////////////////////////////////////////
		console.log('total dir :' );
			
		if(onoff_flag==1 &&flag_alarm==1){
			res.send('alarm');
		}else{
			res.send('stable');
		}
		next();
		}).get(function(req,res,next){
			//sendAPI();
			console.log('end get part of notify');
			}).post(function(req,res){
				console.log(3);
				});

function sendAPI(){


	console.log("in SENDSMS");
	request.post('https://api.coolsms.co.kr/sms/1.1/send',
			{
form : {
api_key : api_key,
timestamp : timestamp,
salt : salt,
signature: signature,
extension : JSON.stringify(extension)
}

},function(err,res,body){
if(err)
console.log(err);
else{
console.log("문자발송 성공");	
}

});

}
app.get('/sendsms',function(req,res){

		console.log("in SENDSMS");
		request.post('https://api.coolsms.co.kr/sms/1.1/send',
			{
form : {
api_key : api_key,
timestamp : timestamp,
salt : salt,
signature: signature,
extension : JSON.stringify(extension)
}

},function(err,res,body){
if(err)
console.log(err);
else{
console.log("문자발송 성공");	
}

}

);
		});
