import React from "react";
import "../Css/ContactUs.css";
//import {Backend_url} from  "../../Config/config.json";

const ContactUs = () => {
  return (
    <div className="contact-container">
      <h1>Contact Us</h1>
      <p>We'd love to hear from you! Fill out the form below to get in touch.</p>

      <form className="contact-form">
        <div className="form-group">
          <label>Name</label>
          <input type="text" placeholder="Enter your name" required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="Enter your email" required />
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea rows="4" placeholder="Your message..." required></textarea>
        </div>
        <button type="submit" className="contact-btn">Send Message</button>
      </form>
    </div>
  );
};

export default ContactUs;
