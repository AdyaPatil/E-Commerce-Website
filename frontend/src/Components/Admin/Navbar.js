import React, { useState, useEffect } from "react";
import axios from "axios"; // Import Axios for API requests
import "../../Css/Navbar.css";
import { FaBell, FaUserCircle } from "react-icons/fa";
import {Backend_url} from  "../config.json"

const Navbar = () => {
  const [user, setUser] = useState({ firstName: "", lastName: "" });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("user_id"); // Get user_id from localStorage
        const token = localStorage.getItem("access_token"); // Get token for authorization

        if (!userId || !token) {
          console.error("User ID or Token is missing");
          return;
        }

        const response = await axios.get(`http://127.0.0.1:8000/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Assuming the API response contains { first_name, last_name }
        setUser({
          firstName: response.data.first_name,
          lastName: response.data.last_name,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="navbar-admin">
      <h2>Admin Panel</h2>
      <div className="nav-icons">
        <FaBell className="bell-icon" />
        <div className="user-section">
          <FaUserCircle className="user-icon" />
          <span className="user-name">
            {user.firstName} {user.lastName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
