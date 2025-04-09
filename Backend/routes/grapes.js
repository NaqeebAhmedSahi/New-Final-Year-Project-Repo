import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import Pages from '../page/page.modal';
import Websites from '../models/Template';
import multer from 'multer';

const router = express.Router();
const upload = multer();
const promptFilePath = path.join(__dirname, '..', 'prompt.json');
const logFilePath = path.join(__dirname, '..', 'grape-debug.log');

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFilePath, logMessage);
  console.log(message);
}

router.post('/grape', async (req, res) => {
  const { websiteId, pageId, projectData } = req.body;

  logToFile('\n=== NEW REQUEST ===');
  logToFile(`websiteId: ${websiteId}`);
  logToFile(`pageId: ${pageId}`);
  logToFile(`projectData: ${JSON.stringify(projectData, null, 2)}`);

  try {
    const page = await Pages.findOne({ _id: pageId });
    if (!page) {
      logToFile(`ERROR: Page not found with ID: ${pageId}`);
      return res.status(404).json({ message: 'Page not found' });
    }

    // Extract prompt from projectData
    const prompt = projectData && projectData.customPrompt ? projectData.customPrompt : '';
    console.log("Prompt ", prompt);
    console.log("Project Data ", projectData);

    if (!prompt && projectData) {
      logToFile('WARNING: No prompt provided in projectData');
    }

    if (projectData) {
      const promptData = {
        projectType: projectData.projectType || '',
        customPrompt: projectData.customPrompt || '',
        prompt: prompt
      };
      fs.writeFileSync(promptFilePath, JSON.stringify(promptData, null, 2), 'utf-8');
      logToFile('Saved projectData to prompt.json');
    }

    if (page.status === 'new') {
      logToFile('Page status is new - returning basic response');
      return res.json({ status: 'new' });
    } else if (page.status === 'existing') {
      logToFile('Page status is existing - processing with Python script');

      // Path to your Python middleware
      const pythonScriptPath = path.join(__dirname, '..', 'middlewares', 'chatbot.py');

      // Spawn Python process with both prompt and template file as arguments
      const pythonProcess = spawn('python', [pythonScriptPath, 'clothing store', 'index.html']);

      let responseData = '';

      pythonProcess.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Python error: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          return res.status(500).json({ error: 'Failed to get response from chatbot' });
        }

        try {
          const parsedData = JSON.parse(responseData);
          res.json(parsedData);
        } catch (e) {
          res.status(500).json({ error: 'Invalid response from chatbot' });
        }
      });
    }

  } catch (error) {
    logToFile(`TOP LEVEL ERROR: ${error.stack || error}`);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.post('/api/chat', upload.none(), async (req, res) => {
  try {
    const { prompt, template_file, pageId, websiteId, projectType } = req.body;

    if (!prompt || !template_file) {
      return res.status(400).json({ error: 'Prompt and template file are required' });
    }

    const page = await Pages.findOne({ _id: pageId });
    if (!page) {
      logToFile(`ERROR: Page not found with ID: ${pageId}`);
      return res.status(404).json({ message: 'Page not found' });
    }

    const website = await Websites.findOne({ _id: websiteId });
    if (!website) {
      console.log('Website not found with ID:', websiteId);
      return res.status(404).json({ message: 'Website not found' });
    }

    if (page.status === 'new') {
      return res.json({ status: 'new' });
    } else if (page.status === 'existing') {
      const content = website.content;
      const pageName = page.name;
      const pageContent = content.get(pageName);
      let pythonScriptPath = '';

      // Configure paths
      if (projectType == 'ecommerce') {
        pythonScriptPath = path.join(__dirname, '..', 'middlewares', 'chatbot.py');
      } else if (projectType == 'blog') {
        pythonScriptPath = path.join(__dirname, '..', 'middlewares', 'blogChatbot.py');
      } else if (projectType == 'portfolio') {
        pythonScriptPath = path.join(__dirname, '..', 'middlewares', 'portfolioChatbot.py');
      }

      const outputDir = path.join(__dirname, '..', 'rendered_templates');
      const outputFilePath = path.join(outputDir, `rendered_${pageName}.html`);

      // Ensure directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Execute Python script with error handling
      const pythonProcess = spawn('python', [pythonScriptPath, prompt, `${pageName}.html`, pageName]);

      let pythonOutput = '';
      let pythonError = '';

      pythonProcess.stdout.on('data', (data) => {
        pythonOutput += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        pythonError += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        try {
          // Parse the Python script output
          let result;
          try {
            result = JSON.parse(pythonOutput);
          } catch (parseError) {
            console.error('Failed to parse Python output:', pythonOutput);
            throw new Error(`Python output parse error: ${parseError.message}`);
          }

          // Handle Python script errors
          if (code !== 0 || pythonError || result.error) {
            const errorDetails = {
              exitCode: code,
              stderr: pythonError,
              pythonOutput: result.error || pythonOutput
            };
            console.error('Python script failed:', errorDetails);
            return res.status(500).json({
              error: 'Python script execution failed',
              details: errorDetails
            });
          }

          // Verify the output file was created
          if (!fs.existsSync(outputFilePath)) {
            console.error('Expected file not found:', outputFilePath);
            return res.status(500).json({
              error: 'Generated HTML file not found',
              details: `Python script did not create ${outputFilePath}`
            });
          }

          const renderedHtml = fs.readFileSync(outputFilePath, 'utf-8');
          pageContent.htmlContent = renderedHtml;

          return res.json({
            status: 'success',
            name: pageName,
            content: pageContent,
            pythonOutput: result
          });

        } catch (error) {
          console.error('Post-processing error:', error);
          res.status(500).json({
            error: 'Failed to process Python script output',
            details: error.message,
            pythonError: pythonError,
            pythonOutput: pythonOutput
          });
        }
      });
    } 

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

export default router;