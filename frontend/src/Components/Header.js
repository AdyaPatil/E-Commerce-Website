import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../Css/Header.css";
//import {Backend_url} from  "../../Config/config.json";

const Header = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  

  const loginRef = useRef(null);
  const registerRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation(); // Detects page changes

  // Retrieve user from localStorage on mount or when location changes
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setUser({
        first_name: localStorage.getItem("first_name"),
        last_name: localStorage.getItem("last_name"),
        role: localStorage.getItem("role"),
      });
    }
  }, [location]); // Re-run when page changes

  const openLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const openRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        (showLogin && loginRef.current && !loginRef.current.contains(event.target)) ||
        (showRegister && registerRef.current && !registerRef.current.contains(event.target)) ||
        (showDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target))
      ) {
        setShowLogin(false);
        setShowRegister(false);
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLogin, showRegister, showDropdown]);


  const handleRegister = async (event) => {
    event.preventDefault();
  
    const formData = new FormData(event.target);
    const userData = {
      user_id: 0, // Backend auto-generates this
      email: formData.get("email"),
      password: formData.get("password"),
      first_name: formData.get("first_name"), // Fix: Name must match the form
      last_name: formData.get("last_name"),   // Fix: Name must match the form
      phone_number: "0000000000",
      street: "Unknown",
      address: "Unknown",
      state: "Unknown",
      district: "Unknown",
      taluka: "Unknown",
      village: "Unknown",
      pincode: 0,
    };
  
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/register`, userData, {
        headers: { "Content-Type": "application/json" },
      });
  
      if (response.status === 201) {
        alert("Registration successful!");
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.response?.data?.detail || "Registration failed.");
    }
  };
  


  const handleLogin = async (e) => {
    e.preventDefault();

    try {
        const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/auth/login`,
            { email, password },
            { headers: { "Content-Type": "application/json" } }
        );

        if (response.data.access_token && response.data.user) {
            const token = response.data.access_token;
            const userData = response.data.user;

            // Store only necessary user details (excluding role)
            localStorage.setItem("access_token", token);
            localStorage.setItem("user_id", userData.user_id);
            localStorage.setItem("first_name", userData.first_name);
            localStorage.setItem("last_name", userData.last_name);
            localStorage.setItem("role",userData.role);

            setShowLogin(false);

            // Redirect based on user role without storing it
            navigate(userData.role === "admin" ? "/admindashboard" : "/");
        } else {
            alert("Invalid credentials");
        }
    } catch (error) {
        console.error("Login error:", error.response ? error.response.data : error);
        alert("Login failed! Check your credentials.");
    }
};

  

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
        `${process.env.REACT_APP_BACKEND_URL}/auth/logout`,
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
    <>
      <header>
        <div className="navbar-container">
          <div className="navbar-brand">Adi's Shop</div>
          <nav>
            <ul className="nav-links">
              <li><a href="/" className="nav-link">Home</a></li>
              <li><a href="/ProductItem" className="nav-link">Products</a></li>
              <li><a href="/wishlist" className="nav-link"><i className="fas fa-heart"></i> Wishlist</a></li>
              <li><a href="/cart" className="nav-link"><i className="fas fa-shopping-cart"></i> Cart</a></li>
              <li><a href="/orders" className="nav-link"><i className="fas fa-cart-arrow-down"></i> Order</a></li>

              {user ? (
                <li className="user-dropdown" ref={dropdownRef}>
                  <button className="user-btn" onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(prev => !prev);
                  }}>
                    <i className="fas fa-user"></i> {user.first_name} {user.last_name} <i className="fas fa-chevron-down"></i>
                  </button>
                  {showDropdown && (
                    <ul className="dropdown-menu">
                      <li onClick={() => navigate("/profile")}>Profile</li>
                      <li onClick={handleLogout}>Logout</li>
                    </ul>
                  )}
                </li>
              ) : (
                <li>
                  <button className="nav-link login-btn" onClick={openLogin}>
                    <i className="fas fa-user"></i> Login
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>

      {showLogin && (
        <div className="popup-overlay">
          <div className="popup-container" ref={loginRef}>
            <h4>Login</h4>
            <form onSubmit={handleLogin}>
              <input 
                type="email" 
                placeholder="Email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
              <input 
                type="password" 
                placeholder="Password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
              <button type="submit" className="btn btn-primary">Login</button>
              <p className="toggle-text">Not registered? <span onClick={openRegister}>Register</span></p>
            </form>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="popup-overlay">
          <div className="popup-container" ref={registerRef}>
            <h4>Register</h4>
            <form onSubmit={handleRegister}>
            <input type="text" name="first_name" placeholder="First Name" required />
<input type="text" name="last_name" placeholder="Last Name" required />
  <input type="email" name="email" placeholder="Email" required />
  <input type="password" name="password" placeholder="Password" required />
  <button type="submit" className="btn btn-primary">Register</button>
  <p className="toggle-text">
    Already registered? <span onClick={openLogin}>Login</span>
  </p>
</form>

          </div>
        </div>
      )}
    </>
  );
};

export default Header;
