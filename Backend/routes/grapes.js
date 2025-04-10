import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import Pages from '../page/page.modal';
import Websites from '../models/Template';
import multer from 'multer';
import cheerio from 'cheerio';
import axios from 'axios';

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

// Pixabay API Key
const PIXABAY_API_KEY = '46232949-0980a6dc171b3fd59c5a70cda';

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

      // Execute Python script
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

          // Handle errors
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

          // Verify output file
          if (!fs.existsSync(outputFilePath)) {
            console.error('Expected file not found:', outputFilePath);
            return res.status(500).json({
              error: 'Generated HTML file not found',
              details: `Python script did not create ${outputFilePath}`
            });
          }

          let renderedHtml = fs.readFileSync(outputFilePath, 'utf-8');
          let imageData = null;

          // Process images for all ecommerce pages (not just index)
          if (projectType === 'ecommerce') {
            const processed = await replaceAllImages(renderedHtml);
            renderedHtml = processed.html;
            imageData = processed.imageData;
          }

          pageContent.htmlContent = renderedHtml;

          const responseObj = {
            status: 'success',
            name: pageName,
            content: pageContent,
            pythonOutput: result
          };

          // Add image data if available
          if (imageData) {
            responseObj.imageData = imageData;
          }

          return res.json(responseObj);

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

async function replaceAllImages(html) {
  const $ = cheerio.load(html);
  const imageData = {
    keyword: '',
    replacedImages: []
  };

  try {
    // 1. Get the main keyword from navbar brand
    imageData.keyword = $('.navbar-brand').first().text().trim().split(' ')[0].toLowerCase();
console.log("Using keyword:", imageData.keyword);

    
    // 2. Get all image tags
    const allImages = $('img');
    const totalImages = allImages.length;
    
    if (totalImages === 0) {
      console.log("No images found in the HTML");
      return {
        html: $.html(),
        imageData
      };
    }

    // 3. Fetch enough images for all placeholders
    const fetchedImages = await fetchPixabayImages(imageData.keyword, totalImages);
    console.log(`Fetched ${fetchedImages.length} images from Pixabay`);

    // 4. Replace all images in order
    allImages.each((index, element) => {
      const recycledIndex = index % fetchedImages.length;
      const newSrc = fetchedImages[recycledIndex];
      const oldSrc = $(element).attr('src') || '';
      
      // Replace the image source
      $(element).attr('src', newSrc);
      
      // Store replacement info
      imageData.replacedImages.push({
        index,
        oldSrc,
        newSrc,
        alt: $(element).attr('alt') || ''
      });
    });
    
    return {
      html: $.html(),
      imageData
    };
    
  } catch (error) {
    console.error('Error replacing images:', error);
    return {
      html,
      imageData
    };
  }
}

async function fetchPixabayImages(query, count = 1) {
  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: PIXABAY_API_KEY,
        q: query,
        image_type: 'photo',
        per_page: count,
        safesearch: true,
        orientation: 'horizontal',
        editors_choice: true // Get higher quality images
      }
    });

    if (response.data.hits.length === 0) {
      console.warn('No images found for query:', query);
      return getFallbackImages(count);
    }

    return response.data.hits.map(hit => hit.webformatURL);
  } catch (error) {
    console.error('Pixabay API error:', error);
    return getFallbackImages(count);
  }
}

function getFallbackImages(count) {
  const fallbacks = [
    'https://cdn.pixabay.com/photo/2015/01/21/14/14/apparel-606142_640.jpg',
    'https://cdn.pixabay.com/photo/2017/01/13/04/56/t-shirt-1976334_640.jpg',
    'https://cdn.pixabay.com/photo/2016/11/22/19/18/apparel-1850804_640.jpg',
    'https://cdn.pixabay.com/photo/2015/01/21/14/14/apparel-606142_640.jpg',
    'https://cdn.pixabay.com/photo/2015/01/21/14/14/apparel-606142_640.jpg'
  ];
  
  return Array(count).fill().map((_, i) => fallbacks[i % fallbacks.length]);
}

export default router;