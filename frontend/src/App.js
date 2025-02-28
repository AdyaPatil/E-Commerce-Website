import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import "./Css/App.css";
import Header from "./Components/Header";
import Footer from "./Components/Footer";
import MainBody from "./Components/MainBody";
import AboutUs from "./Components/AboutUs";
import ContactUs from "./Components/ContactUs";
import Wishlist from "./Components/Wishlist";
import Cart from "./Components/Cart";
import Fashion from "./Components/Fashion";
import AdminDashboard from "./Components/Admin/AdminDashboard";
import Profile from "./Components/Profile";
import EditProfile from "./Components/EditProfile";
import Checkout from "./Components/Checkout";
import Orders from "./Components/Orders";

function Layout({ setUserRole }) {
  return (
    <div className="App">
      <Header setUserRole={setUserRole} />
      <main>
        <Routes>
          <Route path="/" element={<MainBody />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/products/fashion" element={<Fashion />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole !== userRole) {
      setUserRole(storedRole);
    }

    // Redirect admin users to /admindashboard
    if (userRole === "admin") {
      navigate("/admindashboard");
    }
  }, [userRole, navigate]);

  return (
    <Routes>
      {userRole === "admin" ? (
        <>
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/admindashboard" />} />
        </>
      ) : (
        <Route path="*" element={<Layout setUserRole={setUserRole} />} />
      )}
    </Routes>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
