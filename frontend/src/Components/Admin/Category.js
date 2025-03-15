import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../Css/Category.css";

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  // Fetch categories from the database
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/categories/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`, // Ensure token is stored in localStorage
        },
      })
      .then((response) => {
        setCategories(response.data);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post(
        `${process.env.REACT_APP_BACKEND_URL}/categories/`,
        newCategory,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`, // Add Authorization header
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        setCategories([...categories, response.data]);
        setShowForm(false); // Show table after adding category
        setNewCategory({ name: "", description: "" }); // Reset form
      })
      .catch((error) => {
        console.error("Error adding category:", error);
      });
  };

  return (
    <div className="category-container">
      {/* Page Header with Add Category Button */}
      <div className="category-header">
        <h2>Categories</h2>
        {!showForm && (
          <button className="add-category-btn" onClick={() => setShowForm(true)}>
            + Add Category
          </button>
        )}
      </div>

      {/* Category Form */}
      {showForm ? (
        <div className="category-form-container">
          <form className="category-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Category Name:</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <input
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                required
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className="submit-btn">Submit</button>
              <button type="button" className="back-btn" onClick={() => setShowForm(false)}>Back</button>
            </div>
          </form>
        </div>
      ) : (
        // Categories Table
        <div className="category-table-container">
          <table className="category-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map((category, index) => (
                  <tr key={category.id}>
                    <td>{index + 1}</td>
                    <td>{category.name}</td>
                    <td>{category.description}</td>
                    <td>
                      <button className="edit-btn">Edit</button>
                      <button className="delete-btn">Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Category;
