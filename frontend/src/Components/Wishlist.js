import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Css/Wishlist.css";
import {Backend_url} from  "../config.json"

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch wishlist from localStorage
    const storedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    setWishlist(storedWishlist);

    // Fetch cart items to check for duplicates
    const fetchCartItems = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const response = await fetch(`${Backend_url}/cart/`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const cartData = await response.json();
          setCartItems(cartData);
        }
      } catch (error) {
        console.error("Error fetching cart items:", error);
      }
    };

    fetchCartItems();
  }, []);

  const removeFromWishlist = (productId) => {
    const updatedWishlist = wishlist.filter(item => item.product_id !== productId);
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
  };

  const addToCart = async (item) => {
    if (cartItems.some(cartItem => cartItem.product_id === item.product_id)) {
      alert("Product is already in the cart!");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Please log in to add products to the cart.");
        return;
      }

      const payload = {
        product_id: String(item.product_id),
        name: item.name,
        price: item.price,
        quantity: 1,
        created_date: new Date().toISOString(),
      };

      const response = await fetch(`${Backend_url}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
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
    <div className="wishlist-page">
      <h2>Your Wishlist</h2>
      {wishlist.length === 0 ? (
        <h4>Your wishlist is empty.</h4>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {wishlist.map((item) => (
              <tr key={item.product_id}>
                <td>{item.name}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>
                  <button onClick={() => addToCart(item)}>Add to Cart</button>
                  <button onClick={() => removeFromWishlist(item.product_id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Wishlist;
