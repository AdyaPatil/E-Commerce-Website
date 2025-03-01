import React, { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import "../Css/Cart.css";
//import {Backend_url} from  "../../Config/config.json";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Please log in to view your cart.");
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/cart/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cart items");
      }

      const data = await response.json();
      setCartItems(data);
      calculateTotal(data);
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  const calculateTotal = (items) => {
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotal(totalPrice);
  };

  const updateQuantity = async (cart_id, newQuantity) => {
    if (newQuantity < 1) return; // Prevent quantity from being less than 1

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Please log in to manage your cart.");
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/cart/update/${cart_id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error("Failed to update cart item quantity");
      }

      // Update quantity in state
      const updatedCart = cartItems.map((item) =>
        item.cart_id === cart_id ? { ...item, quantity: newQuantity } : item
      );

      setCartItems(updatedCart);
      calculateTotal(updatedCart);
    } catch (error) {
      console.error("Error updating cart item:", error);
    }
  };

  const removeCartItem = async (cart_id) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Please log in to manage your cart.");
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/cart/remove/${cart_id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to remove cart item");
      }

      // Update UI after successful deletion
      const updatedCart = cartItems.filter((item) => item.cart_id !== cart_id);
      setCartItems(updatedCart);
      calculateTotal(updatedCart);
    } catch (error) {
      console.error("Error removing cart item:", error);
    }
  };

  return (
    <div className="cart-page">
      <h2>Your Shopping Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.cart_id} className="cart-items">
                  <td>
                    <img src={item.image || "/assets/sample-product.jpg"} alt={item.name} width="80" />
                    <p>{item.name}</p>
                  </td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>
                    <button onClick={() => updateQuantity(item.cart_id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cart_id, item.quantity + 1)}>+</button>
                  </td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <button onClick={() => removeCartItem(item.cart_id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="cart-summary">Total: ${total.toFixed(2)}</p>
          <button className="checkout-btn" onClick={() => navigate("/checkout")}>
            Proceed to Checkout
          </button>
        </>
      )}
    </div>
  );
};

export default Cart;
