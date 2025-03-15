import React, { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import Cart from "./Cart";
import "../Css/MainBody.css";
import Bn1 from "../Asset/Bn1.jpg";
import Bn2 from "../Asset/Bn2.webp";
//import {Backend_url} from  "../../Config/config.json";

const bannerImages = [Bn1, Bn2];

const MainBody = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0); // Track current banner index
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, 2000); // Change image every 2 seconds

    return () => clearInterval(interval); // Cleanup interval
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("Backend URL:", process.env.REACT_APP_BACKEND_URL);
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/products/`);
        const data = await response.json();
        console.log("Fetched Products:", data); // Debugging
  
        // Shuffle function
        const shuffleArray = (array) => {
          return array.sort(() => Math.random() - 0.5);
        };
  
        setProducts(shuffleArray(data)); // Set shuffled products
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);
  

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
  
  
  

  const addToWishlist = (product) => {
    try {
      // Get existing wishlist from local storage
      let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  
      // Check if the product is already in the wishlist
      const exists = wishlist.some((item) => item.product_id === product.product_id);
      if (exists) {
        alert("Product is already in the wishlist.");
        return;
      }
  
      // Add product to wishlist
      wishlist.push(product);
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
  
      // Redirect to wishlist page
      window.location.href = "/wishlist";
    } catch (error) {
      console.error("Error adding to wishlist:", error);
    }
  };
  

  return (
    <>
      <div className="container mt-4">
        {/* Carousel Section */}
        <div id="carouselExample" className="carousel slide">
          <div className="carousel-inner">
            <div className="carousel-item active">
              <img
                src={bannerImages[currentIndex]}
                className="d-block w-100"
                alt="Banner"
              />
            </div>
          </div>
        </div>

        {/* Product Grid Section */}
        <div className="product-grid mt-4">
          <h4>Featured Products</h4>
          {loading ? (
            <p>Loading products...</p>
          ) : (
            <div className="row">
              {products.map((product) => (
                <div className="col-md-3" key={product.id}>
                  <div className="card">
                  <img src={product.image_url} className="card-img-top" alt={product.name} />
                    <div className="card-body">
                      <h5 className="card-title">{product.name}</h5>
                      <p className="card-text">${product.price}</p>
                      <button
                        className="btn btn-outline-secondary add-to-wishlist-btn ms-2"
                        onClick={() => addToWishlist(product)}
                      >
                        <i className="fas fa-heart"></i> Add to Wishlist
                      </button>
                      <button
                        className="btn btn-primary add-to-cart-btn"
                        onClick={() => addToCart(product)} // ✅ Pass full product object
                      >
                        <i className="fas fa-cart-plus"></i> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MainBody;
