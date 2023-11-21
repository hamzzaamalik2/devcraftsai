const dotenv = require('dotenv');
const express = require('express');
var bodyParser = require('body-parser');
const mongoose = require('mongoose'); 
const testcase = require('../model/testCaseModel'); 
const puppeteer = require('puppeteer');
const userModel = require('../model/userModel');
const { Configuration, OpenAIApi } = require("openai");
dotenv.config()
const app = express();  
global.__basedir = __dirname;
//JSON PKG
app.use( bodyParser.json({limit: '50mb'}) );
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit:50000
}));
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

const router = express.Router();

const args = [
  '--aggressive-cache-discard',
  '--disable-cache',
  '--disable-application-cache',
  '--disable-offline-load-stale-cache',
  '--disable-gpu-shader-disk-cache',
  '--media-cache-size=0',
  '--disk-cache-size=0',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-infobars',
  '--window-position=0,0',
  '--ignore-certifcate-errors',
  '--ignore-certifcate-errors-spki-list',
  '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
];

const options = {  
  args,
  headless: true,
  ignoreHTTPSErrors: true
};





router.get('/cloneTestCase/:id',async  (req, res, next) => {
  
  const testId = req.params.id;
  const retrievedData  = await testcase.findOne({ _id: testId });
  // Check if data is found
  if (retrievedData) {
    const plainData = retrievedData.toObject();
    delete plainData._id; 
    const newData = await testcase.create(plainData); 

    // Optionally, you can send a response to indicate success
    res.status(200).json({ message: 'Data inserted successfully', data: newData });
  } else {
    // Handle the case where no data is found
    res.status(404).json({ message: 'Data not found' });
  }

});
///////////////////////////////////
//////**Get tour_Guide detail *////
//////////////////////////////////

router.get('/tour_guide/:id', async (req, res)=> {
  
  try{
    const userId = req.params.id;
    
    const data = await userModel.find({ userID: userId });
    res.send({status:200, data: data})

  }catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }

});


router.post('/Updatetour_guideById/:id', async (req, res)=> {
  
  try{
    const userId = req.params.id;
    
    const updatedUser = await userModel.findOneAndUpdate(
      { userID: userId },
      { $set: { tour_guide: true } },
      { new: true }
    );

    if (updatedUser) {
      res.send({ status: 200, data: updatedUser });
    } else {
      res.status(404).send({ status: 404, error: 'User not found' });
    }

  }catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }

});


///////////////////////////////
//////**GenerateTeseCase *////
/////////////////////////////
router.post('/generateTestCase',async  (req, res, next) => {
    var mainFollow = "";
    let BodyHtmlData
    let loginSteps= "";
    if(req.body.authorization){
      loginSteps+= " Login Steps: Loginurl is "+req.body.loginurl+" username is "+req.body.username+" password is "+req.body.password+ " "
    }
    for(var i=0;i<req.body.array.length;i++){
      mainFollow += " Step " + (i+1) + " ";
      mainFollow = mainFollow + req.body.array[i].action;
      mainFollow = mainFollow + " ";
      mainFollow = mainFollow + req.body.array[i].todo +req.body.array[i].todotext ;
      mainFollow = mainFollow + " ";
      mainFollow = mainFollow + " "+ req.body.array[i].element;
    }
    let Steps
    if(req.body.authorization){
  
      let loginpageHtmlData = await lunchbrowser(req.body.loginurl)
      loginSteps+= " login page elements are Input Elements: " +loginpageHtmlData.inputElementsJSON+ " Button Elements: " +loginpageHtmlData.buttonElementsJSON+" anchor Elements: " +loginpageHtmlData.anchorElementsJSON+" Textarea Elements: " +loginpageHtmlData.textareaElementsJSON+ " select Elements: "+loginpageHtmlData.selectElementsJSON+" radio Elements: " +loginpageHtmlData.radioElements
      
      BodyHtmlData = await loginAndgetElements(req.body.loginurl,req,auth=true)
      
      Steps = ""
    }else{
      Steps = ""
      // Steps = "write a code for cypress script with variables and not harder coded values to "+req.body.testTodo+" into the website  "+req.body.testURL+", "+mainFollow+" , while using the following html as input for element dom selectors without Cypress.moment"
    }
    
    let getHTML = new Promise(async function(myResolve, myReject) {
      try {
        if(req.body.authorization){
          BodyHtmlData = await lunchbrowser(req.body.testURL)
          Steps = "write a code for cypress script the "+loginSteps+" after this goto this url "+req.body.testURL+" main purpose is "+req.body.testTodo+" into the website  "+req.body.testURL+" and steps are "+mainFollow+" and elements of this websites are Input Elements: " +BodyHtmlData.inputElementsJSON+ " Button Elements: " +BodyHtmlData.buttonElementsJSON+" anchor Elements: " +BodyHtmlData.anchorElementsJSON+" Textarea Elements: " +BodyHtmlData.textareaElementsJSON+ " select Elements: "+BodyHtmlData.selectElementsJSON+" radio Elements: " +BodyHtmlData.radioElements+" ,and don't use Cypress.moment."
        }else{
          BodyHtmlData = await lunchbrowser(req.body.testURL)
          Steps = "write a code for cypress script the and main purpose is "+req.body.testTodo+" into the website  "+req.body.testURL+" and steps are "+mainFollow+" and elements of this websites are Input Elements: " +BodyHtmlData.inputElementsJSON+ " Button Elements: " +BodyHtmlData.buttonElementsJSON+" anchor Elements: " +BodyHtmlData.anchorElementsJSON+" Textarea Elements: " +BodyHtmlData.textareaElementsJSON+ " select Elements: "+BodyHtmlData.selectElementsJSON+" radio Elements: " +BodyHtmlData.radioElements+" ,and don't use Cypress.moment."
          
        }
          myResolve(Steps);
          // await browser.close();
  
        
      } catch (err) {
        console.error(err);
      } 
    });
    getHTML.then(
      async function(value) {  
        const completion =  await openai.createChatCompletion({
          model: "gpt-4",
          messages: [
            { role: "system", content: "You are the SQA Tester writing the code in cypress framework" },
            {role: "user", content: Steps+value}
          ],
          temperature: 0.0,
        });
        var result = completion.data.choices[0].message.content;
        const codeBlockRegex = /```([\s\S]+?)```/;
  
        // Extract the code block using the regular expression
        const codeBlockMatches = result.match(codeBlockRegex);

        const codeBlockRegex1 = /```javascript([\s\S]+?)```/;
          
        // Extract the code block using the regular expression
        const codeBlockMatches1 = result.match(codeBlockRegex1);
          
        let cypressScript;

        if (codeBlockMatches) {
            // Extracted Cypress script code
            cypressScript = codeBlockMatches[1];
        } else if (codeBlockMatches1) {
            // Extracted Cypress script code
            cypressScript = codeBlockMatches1[1];
        }else {
            cypressScript = result;
        }
  
        var testcase_detail = new testcase({
          userID: req.body.userId,
          testName: req.body.testName,
          testURL: req.body.testURL,
          testTodo: req.body.testTodo,
          expectedResult: req.body.testResult,
          eventSteps: req.body.array,
          mainSteps: Steps,
          testcaseBody: value,
          testcaseOutput: cypressScript,
          authorization: req.body.authorization,
          loginurl: req.body.username,
          username: req.body.username,
          password: req.body.password,
        });
  
        await testcase_detail.save();
        res.status(200).json({ 
          data: cypressScript
        }) 
      },
      function(error) { /* code if some error */ }
    );
  
  });


///////////////////////////////
//////**compileTestCase *////
/////////////////////////////

router.post('/compileTestCase', async (req, res, next) => {
    let testcaseData
    console.log("BODY ::::::",req.body)
      try {
        var mainFollow = "";
        for(var i=0;i<req.body.steps.length;i++){
          mainFollow += " Step " + (i+1) + " ";
          mainFollow = mainFollow + req.body.steps[i].action;
          mainFollow = mainFollow + " ";
          mainFollow = mainFollow + req.body.steps[i].todo +req.body.steps[i].todotext ;
          mainFollow = mainFollow + " and element ";
          mainFollow = mainFollow + " "+ req.body.steps[i].element;
        }
        console.log(mainFollow)
  
        testcaseData = await testcase.find({_id: req.body._id});
        testcaseData = testcaseData[0]
  
        let BodyHtmlData = await lunchbrowser(testcaseData.testURL)
        console.log(BodyHtmlData)
  
        Steps = "write a code for cypress script and main purpose is "+req.body.testTodo+" into the website  "+req.body.testURL+" and steps are "+mainFollow+" and elements of this websites are Input Elements: " +BodyHtmlData.inputElementsJSON+ " Button Elements: " +BodyHtmlData.buttonElementsJSON+" anchor Elements: " +BodyHtmlData.anchorElementsJSON+" Textarea Elements: " +BodyHtmlData.textareaElementsJSON+ " select Elements: "+BodyHtmlData.selectElementsJSON+" radio Elements: " +BodyHtmlData.radioElementsJSON+" ,and don't use Cypress.moment."
        console.log(Steps)
        // myResolve(Steps);
  
        const completion2 =  await openai.createChatCompletion({ 
          model: "gpt-4",
          messages: [
            { role: "system", content: "You are the SQA Tester writing the code in cypress framework" },
            {role: "user", content: Steps}
          ], 
          temperature: 0.0,
        });
        var result2 = completion2.data.choices[0].message.content;
        const codeBlockRegex = /```([\s\S]+?)```/;
  
        // Extract the code block using the regular expression
        const codeBlockMatches = result2.match(codeBlockRegex);
  
        const codeBlockRegex1 = /```javascript([\s\S]+?)```/;
  
        // Extract the code block using the regular expression
        const codeBlockMatches1 = result2.match(codeBlockRegex1);
  
        let cypressScript;
        if(codeBlockMatches){
  
        // Extracted Cypress script code
        cypressScript = codeBlockMatches[1];
        }else if(codeBlockMatches1){
        // Extracted Cypress script code
        cypressScript = codeBlockMatches[1];
        }else{
          cypressScript=result2
        }
        testcase.updateOne(
          { _id: req.body._id }, // The query to find the document to update
          { 
            $set: { // Use $set to update specific fields
              eventSteps: req.body.steps,
              testcaseOutput: cypressScript
            }
          }
        )
        .then(() => {
          res.status(200).json({ data: cypressScript });
        })
        .catch((error) => {
          console.error(error); // Log the error for debugging
          res.status(400).json({ status: 400, message: "Something Went Wrong" });
        });
  
  
  
  
      } catch (err) {
        console.error(err);
      } 
  
  });


///////////////////////////////
//////**getTestCaseById */////
/////////////////////////////
router.post('/getTestCaseById/:id', async(req, res, next) => {

    try{
      let testcaseData = await testcase.find({_id: req.params.id});
      if(testcaseData.length>0){
        res.status(200).json({ 
          data: testcaseData
        });
      }else{
        res.status(401).json({ 
          message: 'Unable to find TestCase'
        });
      }
      
    }catch(error){
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  
    
  });
  

///////////////////////////////
//////**getAllTestCases */////
/////////////////////////////


router.get('/getAllTestCases/:id', async (req, res) => {
  try {
      const userId = req.params.id;

      const results = await testcase.find({ userID: userId });  
      res.json(results);
  } catch (error) {
      console.error('Error fetching test cases:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});


async function getPageDataBrowser(page,browser) {
    let inputElements,buttonElements,textareaElements
    let inputElementsJSON,buttonElementsJSON,textareaElementsJSON,anchorElementsJSON
    let selectElementsJSON,radioElementsJSON
  
  
    await page.waitForSelector('body');
  
     // Extract input elements
     inputElements = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map(input => {
        return {
          type: input.getAttribute('type'),
          id: input.getAttribute('id'),
          name: input.getAttribute('name')
        };
      });
    });
  
    // Extract button elements
    buttonElements = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(button => {
        const text = button.textContent.replace(/[\t\n]/g, "").trim();
        return {
          text: text,
          type: button.getAttribute('type'),
          class: button.getAttribute('class')
        };
      });
    });
   // Extract anchor (a) elements
   const anchorElements = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    return anchors.map(anchor => {
      const text = anchor.textContent.trim().replace(/[\t\n]/g, '').replace(/"/g, '');
      if (text) { // Check if text is not empty
        return {
          text: text,
          href: anchor.getAttribute('href')
        };
      }
      return null;
    }).filter(anchor => anchor !== null);
  });
    // Extract textarea elements (if any)
    textareaElements = await page.evaluate(() => {
      const textareas = Array.from(document.querySelectorAll('textarea'));
      return textareas.map(textarea => {
        return {
          id: textarea.getAttribute('id'),
          name: textarea.getAttribute('name')
        };
      });
    });
  
    // Extract select (dropdown) elements
  const selectElements = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    return selects.map(select => {
      return {
        id: select.getAttribute('id'),
        name: select.getAttribute('name')
      };
    });
  });
  
  // Extract radio button elements
  const radioElements = await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
    return radios.map(radio => {
      return {
        id: radio.getAttribute('id'),
        name: radio.getAttribute('name')
      };
    });
  });
  
    inputElementsJSON = JSON.stringify(inputElements, null, 2);
    buttonElementsJSON = JSON.stringify(buttonElements, null, 2);
    anchorElementsJSON = JSON.stringify(anchorElements, null, 2);
    textareaElementsJSON = JSON.stringify(textareaElements, null, 2);
    selectElementsJSON = JSON.stringify(selectElements, null, 2);
    radioElementsJSON = JSON.stringify(radioElements, null, 2);
    // await browser.close();
    return {
      inputElementsJSON,
      buttonElementsJSON,
      anchorElementsJSON,
      textareaElementsJSON,
      selectElementsJSON,
      radioElementsJSON
    }
  
}



async function lunchbrowser(Url) {
    let inputElements,buttonElements,textareaElements
    let inputElementsJSON,buttonElementsJSON,textareaElementsJSON,anchorElementsJSON
    let selectElementsJSON,radioElementsJSON
    const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(1200000);
        await page.goto(Url);
      // Wait for the <body> tag to be present on the page
      await page.waitForSelector('body');
        // Extract input elements
        inputElements = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          return inputs.map(input => {
            return {
              type: input.getAttribute('type'),
              id: input.getAttribute('id'),
              name: input.getAttribute('name')
            };
          });
        });
      
        // Extract button elements
        buttonElements = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.map(button => {
            const text = button.textContent.replace(/[\t\n]/g, "").trim();
            return {
              text: text,
              type: button.getAttribute('type'),
              class: button.getAttribute('class')
            };
          });
        });
       // Extract anchor (a) elements
       const anchorElements = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map(anchor => {
          const text = anchor.textContent.trim().replace(/[\t\n]/g, '').replace(/"/g, '');
          if (text) { // Check if text is not empty
            return {
              text: text,
              href: anchor.getAttribute('href')
            };
          }
          return null;
        }).filter(anchor => anchor !== null);
      });
        // Extract textarea elements (if any)
        textareaElements = await page.evaluate(() => {
          const textareas = Array.from(document.querySelectorAll('textarea'));
          return textareas.map(textarea => {
            return {
              id: textarea.getAttribute('id'),
              name: textarea.getAttribute('name')
            };
          });
        });
    
        // Extract select (dropdown) elements
      const selectElements = await page.evaluate(() => {
        const selects = Array.from(document.querySelectorAll('select'));
        return selects.map(select => {
          return {
            id: select.getAttribute('id'),
            name: select.getAttribute('name')
          };
        });
      });
    
      // Extract radio button elements
      const radioElements = await page.evaluate(() => {
        const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
        return radios.map(radio => {
          return {
            id: radio.getAttribute('id'),
            name: radio.getAttribute('name')
          };
        });
      });
      
        inputElementsJSON = JSON.stringify(inputElements, null, 2);
        buttonElementsJSON = JSON.stringify(buttonElements, null, 2);
        anchorElementsJSON = JSON.stringify(anchorElements, null, 2);
        textareaElementsJSON = JSON.stringify(textareaElements, null, 2);
        selectElementsJSON = JSON.stringify(selectElements, null, 2);
        radioElementsJSON = JSON.stringify(radioElements, null, 2);
        // await browser.close();
        return {
          inputElementsJSON,
          buttonElementsJSON,
          anchorElementsJSON,
          textareaElementsJSON,
          selectElementsJSON,
          radioElementsJSON
        }
  }


async function loginAndgetElements(Url,req,auth,loginSteps){
    let page
    let browser
    if(auth){
      browser = await puppeteer.launch(options);
      page = await browser.newPage();
      await page.setDefaultNavigationTimeout(1200000);
    }
    let inputElements,buttonElements,textareaElements
    let inputElementsJSON,buttonElementsJSON,textareaElementsJSON,anchorElementsJSON
    let selectElementsJSON,radioElementsJSON
    
        await page.goto(Url);
      // Wait for the <body> tag to be present on the page
      await page.waitForSelector('body');
        // Extract input elements
        inputElements = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          return inputs.map(input => {
            return {
              type: input.getAttribute('type'),
              id: input.getAttribute('id'),
              name: input.getAttribute('name')
            };
          });
        });
      
        // Extract button elements
        buttonElements = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.map(button => {
            const text = button.textContent.replace(/[\t\n]/g, "").trim();
            return {
              text: text,
              type: button.getAttribute('type'),
              class: button.getAttribute('class')
            };
          });
        });
       // Extract anchor (a) elements
       const anchorElements = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map(anchor => {
          const text = anchor.textContent.trim().replace(/[\t\n]/g, '').replace(/"/g, '');
          if (text) { // Check if text is not empty
            return {
              text: text,
              href: anchor.getAttribute('href')
            };
          }
          return null;
        }).filter(anchor => anchor !== null);
      });
        // Extract textarea elements (if any)
        textareaElements = await page.evaluate(() => {
          const textareas = Array.from(document.querySelectorAll('textarea'));
          return textareas.map(textarea => {
            return {
              id: textarea.getAttribute('id'),
              name: textarea.getAttribute('name')
            };
          });
        });
    
        // Extract select (dropdown) elements
      const selectElements = await page.evaluate(() => {
        const selects = Array.from(document.querySelectorAll('select'));
        return selects.map(select => {
          return {
            id: select.getAttribute('id'),
            name: select.getAttribute('name')
          };
        });
      });
    
      // Extract radio button elements
      const radioElements = await page.evaluate(() => {
        const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
        return radios.map(radio => {
          return {
            id: radio.getAttribute('id'),
            name: radio.getAttribute('name')
          };
        });
      });
      inputElementsJSON = JSON.stringify(inputElements, null, 2);
        buttonElementsJSON = JSON.stringify(buttonElements, null, 2);
        anchorElementsJSON = JSON.stringify(anchorElements, null, 2);
        textareaElementsJSON = JSON.stringify(textareaElements, null, 2);
        selectElementsJSON = JSON.stringify(selectElements, null, 2);
        radioElementsJSON = JSON.stringify(radioElements, null, 2);
        // await browser.close();
        loginSteps += " and login elements are Input Elements: " +inputElementsJSON+ " Button Elements: " +buttonElementsJSON+" anchor Elements: " +anchorElementsJSON+" Textarea Elements: " +textareaElementsJSON+ " select Elements: "+selectElementsJSON+" radio Elements: " +radioElementsJSON
      if(auth){
        if(inputElements[0].id && inputElements[0].id.includes("username")){
          await page.type("input[id='username']", req.body.username);
        }else if(inputElements[0].id &&inputElements[0].id.includes("email")){
          await page.type("input[id='email']", req.body.username);
        }else if(inputElements[0].name &&inputElements[0].name.includes("email")){
          await page.type("input[name='email']", req.body.username);
        }else if(inputElements[0].name && inputElements[0].name.includes("username")){
          await page.type("input[name='username']", req.body.username);
        }else {
          await page.type("input[type='text']", req.body.username);
        }
        if(inputElements[1].type.includes("password") || inputElements[1].id.includes("password") || inputElements[1].name.includes("password")){
          await page.type("input[type='password']", req.body.password);
        }
        const submitElement = buttonElements.find(item => item.text === 'Submit' );
        const submitElement1 = buttonElements.find(item => item.text === 'Login' );
        const submitElement2 = buttonElements.find(item => item.text === 'Log in' );
        if (submitElement || submitElement1 || submitElement2) {
          let submitClass
          if(submitElement){
            submitClass = submitElement.class;
            submitClass = `.${submitClass}`
          }else if(submitElement2){
            submitClass = submitElement2.type;
            submitClass = "button[type='submit']"
          }else {
            submitClass = submitElement1.class;
            submitClass = `.${submitClass}`
          }
          // Perform your actions here
          await page.click(submitClass)
        }
        await page.waitForTimeout(5000);
        await page.goto(req.body.testURL)
        let AllData = await getPageDataBrowser(page,browser)
        return AllData
      }
        
        
        
        return {
          inputElementsJSON,
          buttonElementsJSON,
          anchorElementsJSON,
          textareaElementsJSON,
          selectElementsJSON,
          radioElementsJSON
        }
  }


  module.exports = router;