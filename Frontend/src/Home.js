import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { createPage, pageLoad } from "./redux/actions/pageAction";
import Header from "../src/components/User/Header";

const Home = () => {
  const [name, setName] = useState("");
  const [isValid, setIsValid] = useState(true);
  const dispatch = useDispatch();

  const { pageStore } = useSelector((state) => state);
  const { pages } = pageStore;

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    dispatch(pageLoad(userId));
  }, [dispatch]);

  const handleSubmit = async () => {
    if (!name) {
      setIsValid(false);
      return;
    }

    const userId = localStorage.getItem("userId");
    const websiteId = localStorage.getItem("selectedWebsiteId");
    if (!websiteId) {
      console.error("Website ID is undefined");
      return;
    }

    dispatch(createPage({ name, userId, websiteId }));
    setName("");
    setIsValid(true);
  };

  return (
    <>
      <Header />
      <div className="container py-5">
        <div className="row py-5">
          <div className="col-md-6 offset-md-3 mb-4">
            <div className="card shadow-lg">
              <div className="card-header text-center bg-primary text-white">
                <h5>Create New Page</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                      Page Name
                    </label>
                    <input
                      type="text"
                      className={`form-control ${isValid ? "" : "is-invalid"}`}
                      id="name"
                      name="name"
                      placeholder="Enter page name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    {!isValid && (
                      <div className="invalid-feedback">
                        Please provide a valid name.
                      </div>
                    )}
                  </div>
                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setName("")}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSubmit}
                    >
                      Save Page
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-primary">
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.length > 0 ? (
                    pages.map((page) => (
                      <tr key={page._id}>
                        <td>{page._id}</td>
                        <td>{page.name}</td>
                        <td>{page.slug}</td>
                        <td>
                          <Link
                            to={`/editor/${page._id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">
                        No pages available. Start by creating one!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
