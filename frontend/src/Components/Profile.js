import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Css/Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
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

        const response = await axios.get(`http://127.0.0.1:8000/users/${user_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUser();
  }, []);

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="profile-container">
      <button className="edit-button" onClick={() => navigate("/edit-profile")}>
        Edit
      </button>

      <div className="profile-image-container">
        <img src="https://via.placeholder.com/120" alt="Profile" className="profile-image" />
      </div>

      <div className="profile-details">
        {Object.entries(user)
          .filter(([key]) => key !== "password" && key !== "user_id" && key !== "role")
          .reduce((rows, [key, value], index, array) => {
            if (index % 2 === 0) {
              rows.push([array[index], array[index + 1] || null]);
            }
            return rows;
          }, [])
          .map(([field1, field2], index) => (
            <div key={index} className="profile-row">
              <div className="profile-field">
                <strong>{field1[0].replace("_", " ").toUpperCase()}:</strong> {field1[1]}
              </div>
              {field2 && (
                <div className="profile-field">
                  <strong>{field2[0].replace("_", " ").toUpperCase()}:</strong> {field2[1]}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default Profile;
