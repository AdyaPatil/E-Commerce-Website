import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../Css/ProductItem.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/categories/`);
        const fetchedCategories = response.data;
        setCategories(["All", ...fetchedCategories.map((cat) => cat.name)]);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/products/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const fetchedProducts = response.data;
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
      } catch (err) {
        setError("Failed to fetch products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Apply filters when category or price changes
  useEffect(() => {
    let filtered = products.filter(
      (product) =>
        (selectedCategory === "All" || product.category_name === selectedCategory) &&
        product.price <= priceRange
    );
    setFilteredProducts(filtered);
  }, [selectedCategory, priceRange, products]);

  if (loading) return <p>Loading products...</p>;
  if (error) return <p className="error">{error}</p>;



  const addToCart = async (product) => {
    try {
      const token = localStorage.getItem("access_token");
  
      if (!token) {
        alert("Please log in to add products to the cart.");
        return;
      }
  
      // Fetch existing cart items
      const cartResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/cart`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

  
      if (!cartResponse.ok) {
        throw new Error("Failed to fetch cart data");
      }
  
      const cartData = await cartResponse.json();
      console.log(cartData);
  
      // Check if the product is already in the cart
      const productExists = cartData.some(item => item.product_id === product.product_id);
      if (productExists) {
        alert("This product is already in your cart.");
        return;
      }
  
      // Proceed to add the product to the cart
      const payload = {
        product_id: String(product.product_id),
        name: product.name,
        price: product.price,
        quantity: product.quantity || 1,
        created_date: new Date().toISOString(),
      };
  
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorResponse = await response.json();
        console.error("Backend error response:", errorResponse);
        throw new Error("Failed to add product to cart");
      }
  
      alert("Product added to cart successfully!");
      navigate("/cart");
  
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add product to cart. Please try again.");
    }
  };

  return (
    <div className="products-container-user">
      {/* Sidebar Filter */}
      <aside className="sidebar-user">
        <h2>Filters</h2>
        <div className="filter-section">
          <h3>Category</h3>
          {categories.map((category) => (
            <button
              key={category}
              className={`filter-btn ${selectedCategory === category ? "active" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="filter-section">
          <h3>Price Range</h3>
          <input
            type="range"
            min="100"
            max="10000"
            value={priceRange}
            onChange={(e) => setPriceRange(Number(e.target.value))}
          />
          <p>Up to ₹{priceRange}</p>
        </div>
      </aside>

      {/* Products Display */}
      <main className="products-list">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.product_id} className="product-card">
              <img src={product.image_url} alt={product.name} />
              <h3>{product.name}</h3>
              <p>₹{product.price}</p>
              <button className="add-to-cart" onClick={() => addToCart(product)}>Add to Cart</button>
            </div>
          ))
        ) : (
          <p className="no-products">No products found.</p>
        )}
      </main>
    </div>
  );
};

export default Products;
