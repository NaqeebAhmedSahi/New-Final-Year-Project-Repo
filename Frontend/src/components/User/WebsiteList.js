import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import Header from "./Header";

const WebsiteList = () => {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [expandedWebsite, setExpandedWebsite] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);

  const userId = localStorage.getItem('userId');
  const projectType = JSON.parse(localStorage.getItem('userProject'))?.projectType;
  console.log("User Id", userId, "Project Type:", projectType);
  console.log("User Id", userId);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/templates?type=${projectType}`);
        setWebsites(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching websites: ' + err.message);
        setLoading(false);
      }
    };

    if (projectType) {
      fetchWebsites();
    } else {
      setError('No project type selected');
      setLoading(false);
    }
  }, [projectType]);

  const handleChoose = async (websiteId) => {
    try {
      localStorage.setItem('selectedWebsiteId', websiteId);
      const response = await axios.post('http://localhost:8080/api/pages/store', {
        websiteId,
        userId,
      });

      setMessage(response.data.message);
      setError(null);
      navigate('/home');
    } catch (err) {
      setError('Failed to store pages: ' + err.message);
      setMessage(null);
    }
  };

  const toggleWebsitePages = (websiteId) => {
    if (expandedWebsite === websiteId) {
      setExpandedWebsite(null); // Close if already expanded
    } else {
      setExpandedWebsite(websiteId); // Expand the selected website
    }
  };

  const togglePageContent = (pageId) => {
    if (selectedPage === pageId) {
      setSelectedPage(null); // Close if already selected
    } else {
      setSelectedPage(pageId); // Open the new page
    }
  };

  const totalPages = websites.reduce((acc, website) => {
    return acc + (website.content ? Object.keys(website.content).length : 0);
  }, 0);

  if (loading) {
    return <div>Loading websites...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <Header />
      <div className="container my-5">
        <h2 className="text-center text-dark my-5">Website List</h2>
        <div className="text-center text-secondary">
        <div className="d-flex justify-content-between align-items-center my-3">
  <p className="mb-0">
    Total Websites: <strong>{websites.length}</strong> | Total Pages: <strong>{totalPages}</strong>
  </p>
</div>

        </div>
        {websites.length === 0 ? (
          <p className="text-center text-dark">No websites found.</p>
        ) : (
          <div className="row">
            {websites.map((website) => {
              const pageCount = website.content
                ? Object.keys(website.content).length
                : 0;

              return (
                <div key={website._id} className="col-md-4 mb-4">
                  <div className="card shadow-lg rounded">
                    <div className="card-body text-dark">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="card-title">{website.name}</h5>
                        <button
                          className="btn btn-sm btn-outline-primary btn-rounded"
                          onClick={() => toggleWebsitePages(website._id)}
                        >
                          {expandedWebsite === website._id ? "▲" : "▼"}
                        </button>
                      </div>
                      <p className="text-secondary">
                        Pages: <strong>{pageCount}</strong>
                      </p>
                      {expandedWebsite === website._id && website.content && (
                        <ul className="list-group mb-3">
                          {Object.keys(website.content).map((pageId) => {
                            const page = website.content[pageId];
                            return (
                              <li key={pageId} className="list-group-item">
                                <div className="d-flex justify-content-between align-items-center">
                                  <span>{page.htmlFileName}</span>
                                  <button
                                    className="btn btn-sm btn-outline-primary btn-rounded"
                                    onClick={() => togglePageContent(pageId)}
                                  >
                                    {selectedPage === pageId ? "▲" : "▼"}
                                  </button>
                                </div>
                                {selectedPage === pageId && (
                                  <div className="mt-3">
                                    <h6>HTML Content:</h6>
                                    <pre className="bg-light p-3 border rounded">
                                      {page.htmlContent}
                                    </pre>
                                    <h6>CSS Content:</h6>
                                    <pre className="bg-light p-3 border rounded">
                                      {page.cssContent}
                                    </pre>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <button
                        onClick={() => handleChoose(website._id)}
                        className="btn btn-secondary"
                      >
                        Choose This One
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Success or Error Message */}
        {message && <div className="alert alert-success mt-3">{message}</div>}
        {error && <div className="alert alert-danger mt-3">{error}</div>}
      </div>
    </>
  );
};

export default WebsiteList;
