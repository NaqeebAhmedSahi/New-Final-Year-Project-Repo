import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminHeader from './AdminHeader';

const ManageTemplates = () => {
  const [websiteName, setWebsiteName] = useState('');
  const [websiteType, setWebsiteType] = useState('ecommerce'); 
  const [websites, setWebsites] = useState([]);
  const navigate = useNavigate();

  // Fetch the list of websites on component mount
  useEffect(() => {
    axios.get('http://localhost:8080/api/templates')
      .then((response) => setWebsites(response.data))
      .catch((error) => {
        console.error('Error fetching websites:', error);
        toast.error('Failed to fetch websites. Please try again.');
      });
  }, []);

  // Add a new website
  const addWebsite = (event) => {
    event.preventDefault();
    axios.post('http://localhost:8080/api/templates', { 
      name: websiteName,
      type: websiteType 
    })
      .then((response) => {
        toast.success(`Website "${websiteName}" added successfully!`);
        setWebsiteName('');
        setWebsites([...websites, response.data]);
      })
      .catch((error) => {
        console.error('Error adding website:', error);
        toast.error('Failed to add website. Please try again.');
      });
  };


  // Delete a website
  const deleteWebsite = (websiteId) => {
    axios.delete(`http://localhost:8080/api/templates/${websiteId}`)
      .then(() => {
        setWebsites(websites.filter((website) => website._id !== websiteId));
        toast.success('Website deleted successfully.');
      })
      .catch((error) => {
        console.error('Error deleting website:', error);
        toast.error('Failed to delete website. Please try again.');
      });
  };

  return (
    <div className="manage bg-light">
      <AdminHeader />
      <div className="container mt-4 mb-5 p-4 rounded shadow-sm bg-white">
        <h2 className="text-center mb-4 text-primary">Manage Website Templates</h2>

        {/* Updated form with type selection */}
        <form onSubmit={addWebsite} className="mb-4">
          <div className="form-group">
            <label htmlFor="websiteName" className="font-weight-bold">Website Name:</label>
            <input
              type="text"
              className="form-control border-primary"
              id="websiteName"
              value={websiteName}
              onChange={(e) => setWebsiteName(e.target.value)}
              placeholder="Enter website name"
              required
            />
          </div>
          <div className="form-group mt-3">
            <label htmlFor="websiteType" className="font-weight-bold">Website Type:</label>
            <select
              className="form-control border-primary"
              id="websiteType"
              value={websiteType}
              onChange={(e) => setWebsiteType(e.target.value)}
              required
            >
              <option value="ecommerce">E-commerce</option>
              <option value="blog">Blog</option>
              <option value="portfolio">Portfolio</option>
            </select>
          </div>
          <button type="submit" className="btn btn-success btn-block mt-3">Add Website</button>
        </form>

        {/* Updated table to show type */}
        <h3 className="mb-3 text-secondary">Existing Websites:</h3>
        <div className="table-responsive">
          <table className="table table-hover table-bordered">
            <thead className="thead-dark">
              <tr>
                <th>Website Name</th>
                <th>Type</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {websites.map((website) => (
                <tr key={website._id}>
                  <td className="align-middle">{website.name}</td>
                  <td className="align-middle text-capitalize">{website.type}</td>
                  <td className="text-center align-middle">
                    <button
                      className="btn btn-danger btn-sm mr-2"
                      onClick={() => deleteWebsite(website._id)}
                    >
                      Delete
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/manage-pages/${website._id}`)}
                    >
                      Manage Pages
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <footer className="footer text-center">
        <p>&copy; 2024 GrapeJs: NLP Web Craft | All Rights Reserved</p>
      </footer>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default ManageTemplates;
