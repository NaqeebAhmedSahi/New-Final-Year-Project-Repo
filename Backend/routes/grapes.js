import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import Pages from '../page/page.modal'; // Replace with the correct path to your Page schema
import Websites from '../models/Template'; // Replace with the correct path to your Website schema

const router = express.Router();

router.post('/', async (req, res) => {
  const { websiteId, pageId } = req.body;
  console.log('Received request with websiteId:', websiteId, 'and pageId:', pageId);

  try {
    // Find the page in the database by pageId
    const page = await Pages.findOne({ _id: pageId });
    console.log('Page fetched from database:', page);

    if (!page) {
      console.log('Page not found with ID:', pageId);
      return res.status(404).json({ message: 'Page not found' });
    }

    // Check if the page is 'new'
    if (page.status === 'new') {
      console.log('Page status is new');
      return res.json({ status: 'new' });
    }

    // If the page is 'existing', fetch the website content
    if (page.status === 'existing') {
      console.log('Page status is existing, fetching website content');
      const website = await Websites.findOne({ _id: websiteId });

      page.status = 'new'; // Update status to 'new'
      await page.save();
      console.log(`Page status updated to 'new' for page ID: ${pageId}`);

      if (!website) {
        console.log('Website not found with ID:', websiteId);
        return res.status(404).json({ message: 'Website not found' });
      }

      console.log('Website content fetched:', website.content);

      const content = website.content;
      const pageName = page.name;

      if (!content || !content.has(pageName)) {
        return res.status(404).json({ message: `Content not found for page: ${pageName}` });
      }

      const pageContent = content.get(pageName);
      console.log('PageContent:', pageContent);
      console.log('Page Name:', pageName);

      const tempHtmlFilePath = path.join(__dirname, '..', 'temp.html');
      fs.writeFileSync(tempHtmlFilePath, pageContent.htmlContent);
      console.log('HTML content saved to:', tempHtmlFilePath);

      const pythonScriptPath = path.join(__dirname, '..', 'render_template.py');
      console.log('Python script path:', pythonScriptPath);

      // Spawn the Python script and pass the file path as an argument
      const pythonProcess = spawn('python', [pythonScriptPath, tempHtmlFilePath]);

      let renderedHtml = '';
      pythonProcess.stdout.on('data', (data) => {
        renderedHtml += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Python script stderr: ${data}`);
      });

      pythonProcess.on('close', async (code) => {
        console.log(`Python script exited with code ${code}`);
        console.log('Final Rendered Output:', renderedHtml);

        // Update pageContent with rendered HTML
        pageContent.htmlContent = renderedHtml;

        // Send the updated pageContent to the frontend
        return res.json({
          status: 'existing',
          name: pageName,
          content: pageContent, // Updated page content
        });
      });
    } else {
      console.log('Unexpected page status:', page.status);
      res.status(400).json({ message: 'Invalid page status' });
    }
  } catch (error) {
    console.error('Error fetching page status or website content:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
