
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
const axios = require('axios');
const crypto = require('crypto');
const { Octokit } = require('@octokit/rest');


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


const GPT3_API_KEY = 'sk-5mel8hcDAmQDAisM79fuT3BlbkFJKH';
const GITHUB_TOKEN = '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';
const GITHUB_SECRET = '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';

// Set up the GitHub API client
const octokit = new Octokit({ auth: GITHUB_TOKEN });



//CONNECT WITH DB
let dev_db_url = "mongodb+srv://admin:admin@cluster0.xisronh.mongodb.net/TestCasesOpenAI";
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

// Define a route to receive pull request events
app.post('/webhook', async (req, res) => {
  const event = req.headers['x-github-event'];
  const signature = req.headers['x-hub-signature-256']; // GitHub's signature header
  const payload = req.body;

  if (signature && verifyGitHubSignature(GITHUB_SECRET, signature, JSON.stringify(req.body))) {
    if (event === 'pull_request' && payload.action === 'opened') {
      // Extract pull request data
      const pr = payload.pull_request;
      const prNumber = pr.number;
      const repo = pr.base.repo.full_name;
      const codeToReview = pr.body; // This is the code to review, you may need to extract it from the repository.

      // Customize prompts or fetch from customer settings
      const prompts = ['Review this code:', 'What can be improved?', 'Any potential issues?'];

      // Generate GPT-3 comments
      const gptComments = await generateGPT3Comments(codeToReview, prompts);

      // Post comments to the pull request
      await postCommentsToPR(repo, prNumber, gptComments);

      res.status(200).end();
    } else {
      res.status(400).end();
    }
  } else {
    res.status(403).end(); // Return forbidden status if the signature is invalid
  }
});

// Function to verify the GitHub webhook signature 
function verifyGitHubSignature(secret, signature, payload) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
// Function to generate comments using GPT-3
async function generateGPT3Comments(code, prompts) {
  // Construct the request to GPT-3
  const requestBody = {
    prompt: `${code}\n${prompts.join('\n')}`, // Include the code for review in the prompt
    max_tokens: 100, // Adjust as needed
  };

  // Make a request to the GPT-3 API
  const response = await axios.post('https://api.openai.com/v1/engines/text-davinci-002/completions', requestBody, {
    headers: {
      'Authorization': `Bearer ${GPT3_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data.choices[0].text.trim();
}

// Function to post comments to the pull request
async function postCommentsToPR(repo, prNumber, comments) {
  await octokit.issues.createComment({
    owner: repo.split('/')[0],
    repo: repo.split('/')[1],
    issue_number: prNumber,
    body: comments,
  });
}

//HOW DO WE START LISTENING
app.listen(process.env.PORT  || 7003);
