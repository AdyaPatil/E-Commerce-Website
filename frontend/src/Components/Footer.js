import React from "react";
import "../Css/Footer.css";

const Footer = () => {
  return (
    <footer>
      <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
      <div className="social-icons">
        <a href="#"><i className="fab fa-facebook"></i></a>
        <a href="#"><i className="fab fa-twitter"></i></a>
        <a href="#"><i className="fab fa-instagram"></i></a>
      </div>
    </footer>
  );
};

export default Footer;
