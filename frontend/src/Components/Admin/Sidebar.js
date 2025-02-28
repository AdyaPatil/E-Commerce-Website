// Sidebar.js
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../../Css/Sidebar.css";
import { FaHome, FaUser, FaShoppingCart, FaCog } from "react-icons/fa";
import {Backend_url} from  "../config.json"



const Sidebar = ({ setActivePage }) => {

  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        console.warn("No token found, already logged out.");
        setUser(null);
        navigate("/");
        return;
      }

      await axios.post(
        "http://127.0.0.1:8000/auth/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove only relevant user-related data, don't clear everything
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("first_name");
      localStorage.removeItem("last_name");
      localStorage.removeItem("role");

      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error.response ? error.response.data : error);
      alert("Logout failed! Please try again.");
    }
  };

  return (
    <div className="sidebar">
      <h2>Admin Panel</h2>
      <ul>
        <li onClick={() => setActivePage("dashboard")}>
          <FaHome /> Dashboard
        </li>
        <li onClick={() => setActivePage("customers")}>
          <FaUser /> Customers
        </li>
        <li onClick={() => setActivePage("orders")}>
          <FaShoppingCart /> Orders
        </li>
        <li onClick={() => setActivePage("products")}>
          <FaShoppingCart /> Product
        </li>
        <li onClick={handleLogout}>
          <FaCog /> Logout
        </li>
      </ul>
      <div className="footer">&copy; 2025 Your Company</div>
    </div>
  );
};

export default Sidebar;
