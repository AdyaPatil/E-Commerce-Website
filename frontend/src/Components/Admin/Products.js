import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../Css/Product.css";
import EditProduct from "./EditProduct";

const Product = ({ setActivePage }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // Added missing categories state
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {

        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      })
      .catch((error) => console.error("Error fetching products:", error));

    fetch("http://127.0.0.1:8000/categories", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((error) => console.error("Error fetching categories:", error));
  }, []);

  const handleEditClick = (product) => {
    setSelectedProduct(product); // Store selected product
    setIsEditPopupOpen(true); // Open edit popup
  };

  const closeEditPopup = () => {
    setIsEditPopupOpen(false); // Close edit popup
    setSelectedProduct(null); // Reset selected product
  };
 
  const handleDeleteProduct = async (productId) => {
    const token = localStorage.getItem("access_token");
  
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;
  
    try {
      const response = await fetch(`http://127.0.0.1:8000/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        alert("Product deleted successfully!");
        navigate("/products"); // Navigate to the products page after deletion
      } else {
        alert("Failed to delete product.");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("An error occurred while deleting the product.");
    }
  };
  

  return (
    <div className="product-container">
      <div className="product-header">
        <button className="back-button" onClick={() => window.history.back()}>
          Back
        </button>
        <input
          type="text"
          placeholder="Search products..."
          className="search-bar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="add-product-btn" onClick={() => setActivePage("addproduct")}>
          Add Product
        </button>
      </div>

      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category</th>
            <th>Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products
            .filter((product) =>
              product.name.toLowerCase().includes(search.toLowerCase())
            )
            .map((product) => (
              <tr key={product.product_id}>
                <td>{product.product_id}</td>
                <td>{product.name}</td>
                <td>{product.description}</td>
                <td>${product.price}</td>
                <td>{product.stock}</td>
                <td>{product.category_name}</td>
                <td>
                <img src={product.image_url} width="50"
                    height="50" alt={product.name} />
                </td>
                <td>
                  <button className="edit-btn" onClick={() => handleEditClick(product)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDeleteProduct(product.product_id)}>Delete</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      
      {isEditPopupOpen && selectedProduct && categories.length > 0 && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EditProduct
              product={selectedProduct}
              categories={categories}
              closeEditPopup={closeEditPopup} // Fixed function reference
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;
