// src/components/Prompt.js
import React, { useState } from 'react';
import '../../styles/User/prompt.css';
import "../../styles/User/loginPage.css";
import Header from './Header';
import { useNavigate } from 'react-router-dom';

const Prompt = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const handleProjectSelect = (e) => {
    setSelectedProject(e.target.id);
  };

  const handlePromptChange = (e) => {
    setCustomPrompt(e.target.value);
  };

  const handleSubmit = () => {
    // Get the description of the selected project
    let projectDescription = '';
    if (selectedProject) {
      const selectedLabel = document.querySelector(`label[for="${selectedProject}"]`);
      if (selectedLabel) {
        projectDescription = selectedLabel.textContent.trim();
      }
    }

    // Prepare data to store
    const projectData = {
      projectType: selectedProject,
      projectDescription: projectDescription,
      customPrompt: customPrompt,
      timestamp: new Date().toISOString()
    };

    // Store in localStorage
    localStorage.setItem('userProject', JSON.stringify(projectData));
    
    // Navigate to websites page
    navigate('/websites');
  };

  return (
    <div>
      <Header/>
      <div className="home">
        <div className="container">
          <h2 className="text-center text-white">Select Your Project Type</h2>
          <p className="text-center text-white mb-4">
            Choose the type of AI-powered web builder you'd like to create. Whether it's for an E-commerce site, a personal blog, or a portfolio, we've got you covered!
          </p>

          <div className="row">
            <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
              <input 
                type="radio" 
                id="prompt1" 
                name="prompt" 
                className="radio-box" 
                onChange={handleProjectSelect}
              />
              <label htmlFor="prompt1" className="radio-label">
                <strong>E-commerce Builder</strong>
                <br />
                Create a powerful online store with AI-generated layouts, product pages, and shopping cart functionality.
              </label>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
              <input 
                type="radio" 
                id="prompt2" 
                name="prompt" 
                className="radio-box" 
                onChange={handleProjectSelect}
              />
              <label htmlFor="prompt2" className="radio-label">
                <strong>Blog Builder</strong>
                <br />
                Start your own blog with beautiful templates, AI-generated content suggestions.
              </label>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
              <input 
                type="radio" 
                id="prompt3" 
                name="prompt" 
                className="radio-box" 
                onChange={handleProjectSelect}
              />
              <label htmlFor="prompt3" className="radio-label">
                <strong>Portfolio Builder</strong>
                <br />
                Showcase your skills and <ion-icon name="send-outline"></ion-icon> projects with an AI-designed portfolio that highlights your work in the best way possible.
              </label>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-md-8 col-sm-12 mx-auto">
              <label htmlFor="website-input" className="text-white">You can write a prompt for the creation of your specific website:</label>
              <div className="input-group">
                <input 
                  type="text" 
                  id="website-input" 
                  className="form-control" 
                  placeholder="e.g., 'I want to build an e-commerce site for handmade crafts that includes product categories, user reviews, and a shopping cart.'" 
                  aria-label="Project Details" 
                  aria-describedby="submit-btn" 
                  value={customPrompt}
                  onChange={handlePromptChange}
                />
                <div className="input-group-append">
                  <button 
                    onClick={handleSubmit} 
                    className="btn btn-primary mt-1" 
                    type="button" 
                    id="submit-btn"
                    disabled={!selectedProject && !customPrompt}
                  >
                    <ion-icon name="send-outline"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="home-footer">
        <p className="text-center">&copy; 2024 Grapes: NLP Web Craft. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Prompt;