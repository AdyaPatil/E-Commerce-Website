import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import indiaData from "../data/indiaData"; // Import the India data
import "../Css/EditProfile.css";
import {Backend_url} from  "../config.json"

const EditProfile = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    street: "",
    address: "",
    state: "",
    district: "",
    taluka: "",
    village: "",
    pincode: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const user_id = localStorage.getItem("user_id");

        if (!token || !user_id) {
          console.error("Token or user_id missing");
          return;
        }

        const response = await axios.get(`${Backend_url}/users/${user_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { user_id: _, role: __, ...editableData } = response.data;
        setFormData(editableData);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle state selection
  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setFormData({ ...formData, state: selectedState, district: "", taluka: "", village: "" });
  };

  // Handle district selection
  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    setFormData({ ...formData, district: selectedDistrict, taluka: "", village: "" });
  };

  // Handle taluka selection
  const handleTalukaChange = (e) => {
    const selectedTaluka = e.target.value;
    setFormData({ ...formData, taluka: selectedTaluka, village: "" });
  };

  // Handle village selection
  const handleVillageChange = (e) => {
    setFormData({ ...formData, village: e.target.value });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const user_id = localStorage.getItem("user_id");

      if (!token || !user_id) {
        console.error("Token or user_id missing");
        return;
      }

      await axios.put(`${Backend_url}/users/${user_id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="profile-container">
      <h3>Edit Profile</h3>
      <form className="profile-form">
        <div className="form-row">
          <input type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} />
          <input type="text" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} />
        </div>
        <div className="form-row">
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
          <input type="text" name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} />
        </div>
        <div className="form-row">
          <input type="text" name="street" placeholder="Street" value={formData.street} onChange={handleChange} />
          <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} />
        </div>
        <div className="form-row">
          {/* State Dropdown */}
          <select name="state" value={formData.state} onChange={handleStateChange}>
            <option value="">Select State</option>
            {Object.keys(indiaData).map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {/* District Dropdown */}
          <select name="district" value={formData.district} onChange={handleDistrictChange} disabled={!formData.state}>
            <option value="">Select District</option>
            {formData.state && Object.keys(indiaData[formData.state] || {}).map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          {/* Taluka Dropdown */}
          <select name="taluka" value={formData.taluka} onChange={handleTalukaChange} disabled={!formData.district}>
            <option value="">Select Taluka</option>
            {formData.district && Object.keys(indiaData[formData.state]?.[formData.district] || {}).map((taluka) => (
              <option key={taluka} value={taluka}>{taluka}</option>
            ))}
          </select>
          {/* Village Dropdown */}
          <select name="village" value={formData.village} onChange={handleVillageChange} disabled={!formData.taluka}>
            <option value="">Select Village</option>
            {formData.taluka && indiaData[formData.state]?.[formData.district]?.[formData.taluka]?.map((village) => (
              <option key={village} value={village}>{village}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <input type="number" name="pincode" placeholder="Pincode" value={formData.pincode} onChange={handleChange} />
        </div>
        <div className="modal-buttons">
          <button className="cancel-button" onClick={() => navigate("/profile")}>Cancel</button>
          <button className="save-button" onClick={handleSave}>Save</button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
