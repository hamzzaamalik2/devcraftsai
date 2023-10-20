
const https = require('https');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const testcase = require('./model/testCaseModel');
var path = require('path');
const puppeteer = require('puppeteer');
const app = express();  
var bodyParser = require('body-parser');
var cors = require('cors');
var testCases = require('./router/testCases');

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

//global variable
global.__basedir = __dirname;

dotenv.config()
global.__basedir = __dirname;
//JSON PKG
app.use( bodyParser.json({limit: '50mb'}) );
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit:50000
}));
app.use(cors());

//CONNECT WITH DB
let dev_db_url = process.env.BASE_URL;
const mongoDB = dev_db_url;
mongoose.connect(mongoDB, {useNewUrlParser : true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function cb() {
    console.log('Successfully connected to database ');
   });

app.use('/api', testCases);
 

// view engine setup
app.set('views', path.join(__dirname, 'views')); 

app.use(express.static(__dirname + '/views/dist'));
app.set('views', path.join(__dirname, '/views/dist'));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('*', (req, res)=>{
  res.sendFile(path.join(__dirname, '/views/dist/index.html'))
});
//HOW DO WE START LISTENING
app.listen(process.env.PORT  || 7003);
