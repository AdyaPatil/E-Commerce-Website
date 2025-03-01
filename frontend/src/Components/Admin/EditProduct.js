import React, { useState, useEffect } from "react";
import "../../Css/EditProduct.css";
//import {Backend_url} from  "../../../config.json"

const EditProduct = ({ product, categories, closeEditPopup }) => {
  const token = localStorage.getItem("access_token");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    image: null,
    image_url: "",
  });

  useEffect(() => {
    if (product) {
      const selectedCategory = categories.find(
        (cat) => cat.name === product.category_name
      );

      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        stock: product.stock || "",
        category_id: selectedCategory ? selectedCategory.category_id : "",
        image: null,
        image_url: product.image_url || "",
      });
    }
  }, [product, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevData) => ({
        ...prevData,
        image: file,
        image_url: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Submitting FormData:", formData);

    let imageUrl = formData.image_url;

    // Upload image if a new image is selected
    if (formData.image) {
        const imageData = new FormData();
        imageData.append("file", formData.image);

        try {
            const uploadResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/upload/`, {
                method: "POST",
                body: imageData,
            });

            if (uploadResponse.ok) {
                const data = await uploadResponse.json();
                imageUrl = data.image_url;
            } else {
                throw new Error("Image upload failed");
            }
        } catch (error) {
            console.error("Failed to upload image", error);
            alert("Image upload failed");
            return;
        }
    }

    // Prepare JSON data (instead of FormData)
    const updatedProductData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        category_id: formData.category_id,
        image_url: imageUrl,
    };

    try {
        const response = await fetch(
            `${process.env.REACT_APP_BACKEND_URL}/products/${product.product_id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatedProductData), // Sending JSON data
            }
        );

        if (response.ok) {
            console.log("Updated Product Data:", updatedProductData);
            alert("Product updated successfully!");
            closeEditPopup();
        } else {
            const errorResponse = await response.json();
            console.error("Failed to update product:", errorResponse);
            alert("Failed to update product.");
        }
    } catch (error) {
        console.error("Error updating product:", error);
    }
};

  return (
    <div className="edit-product-container">
      <h2>Edit Product</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description"
          required
        />
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          placeholder="Price"
          required
        />
        <input
          type="number"
          name="stock"
          value={formData.stock}
          onChange={handleChange}
          placeholder="Stock"
          required
        />
        <select
          name="category_id"
          value={formData.category_id || ""}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          type="file"
          name="image"
          onChange={handleImageChange}
          accept="image/*"
        />
        {formData.image_url && (
          <img src={formData.image_url} alt="Product" className="product-image" />
        )}
        <div className="btn-container">
          <button type="submit" className="save-btn">Save</button>
          <button type="button" className="cancel-btn" onClick={closeEditPopup}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;