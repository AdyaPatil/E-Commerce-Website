import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../Css/AddProduct.css";
import {Backend_url} from  "../config.json"

const AddProduct = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/categories/");
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched Categories:", data); // Debugging
          setCategories(data);
        } else {
          console.error("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
  
    fetchCategories();
  }, []);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    setFormData((prevState) => ({
      ...prevState,
      [name]: name === "category_id" ? parseInt(value, 10) || "" : value, 
    }));
  };
  
  
  

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current.click(); // Open file selection dialog on click
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Submitting FormData:", formData);

    const token = localStorage.getItem("access_token");

    let imageUrl = null;

    // Upload image to S3 first
    if (formData.image) {
        const imageData = new FormData();
        imageData.append("file", formData.image);

        try {
            const uploadResponse = await fetch("http://127.0.0.1:8000/upload/", {
                method: "POST",
                body: imageData,
            });

            if (uploadResponse.ok) {
                const data = await uploadResponse.json();
                imageUrl = data.image_url; // Get the image URL from S3
            } else {
                throw new Error("Image upload failed");
            }
        } catch (error) {
            console.error("Failed to upload image", error);
            alert("Image upload failed");
            return;
        }
    }

    // Send product data with image URL to backend
    try {
        const response = await fetch("http://127.0.0.1:8000/products/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: formData.name,
                description: formData.description || null,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock, 10),
                category_id: String(formData.category_id), // Ensure it's a string
                image_url: imageUrl, // ✅ Pass S3 image URL
            }),
        });

        if (response.ok) {
            alert("Product added successfully!");
        } else {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            alert("Failed to add product.");
        }
    } catch (error) {
        console.error("Request Error:", error);
        alert("An error occurred.");
    }
};

  
  

  return (
    <div className="add-product-container">
      <h2>Add New Product</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Product Name" onChange={handleChange} required />
        <input type="text" name="description" placeholder="Description" onChange={handleChange} required />
        <input type="number" name="price" placeholder="Price" onChange={handleChange} required />
        <input type="number" name="stock" placeholder="Stock" onChange={handleChange} required />

        <select name="category_id" onChange={handleChange} required>
  <option value="">Select Category</option>
  {categories.map((category) => (
    <option key={category.category_id} value={category.category_id}>
      {category.name}
    </option>
  ))}
</select>


        {/* Drag & Drop Upload Area */}
        <div
          className="drop-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={handleDropZoneClick} // Clicking opens file selector
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="image-preview" />
          ) : (
            <p>Drag & Drop an image here or click to select</p>
          )}
          <input
            type="file"
            name="image"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            hidden
          />
        </div>

        <button type="submit">Submit</button>
      </form>
      <button className="back-button" onClick={() => navigate("/products")}>Back</button>
    </div>
  );
};

export default AddProduct;
