import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../Css/Customer.css";

const Customer = ({ setActivePage }) => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const customersPerPage = 5;

  // New states for adding users
  const [showForm, setShowForm] = useState(false);
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

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Missing authentication token.");

      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status !== 200) {
        throw new Error(`API error: ${response.statusText}`);
      }

      setCustomers(response.data);
    } catch (err) {
      console.error("Error fetching customers:", err.message);
      setError(err.message);
    }
  };

  const deleteCustomer = async (user_id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Missing authentication token.");

      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/users/${user_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCustomers(customers.filter((customer) => customer.user_id !== user_id));
      alert("Customer deleted successfully!");
    } catch (err) {
      console.error("Error deleting customer:", err.message);
      alert("Failed to delete customer.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Missing authentication token.");

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/users/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 201) {
        alert("User added successfully!");
        fetchCustomers(); // Refresh the list
        setShowForm(false);
      }
    } catch (err) {
      console.error("Error adding customer:", err.message);
      alert("Failed to add user.");
    }
  };

  const filteredCustomers = customers?.filter((customer) =>
    (`${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);


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
        fetchCustomers(); // Refresh the table
        setShowForm(false); // Hide the form after registration
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.response?.data?.detail || "Registration failed.");
    }
  };
  

  return (
    <div className="customer-page">
      <div className="customer-header">
        <input
          type="text"
          className="search-bar"
          placeholder="Search Customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {!showForm && (
          <button className="add-category-btn" onClick={() => setShowForm(true)}>
            + Add User
          </button>
        )}
      </div>
  
      {/* Show form when Add User button is clicked */}
      {showForm ? (
        <form onSubmit={handleRegister} className="customer-form">
          <input type="text" name="first_name" placeholder="First Name" required />
          <input type="text" name="last_name" placeholder="Last Name" required />
          <input type="email" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Password" required />
          <div className="modal-buttons">
            <button className="cancel-button" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button className="save-button" type="submit">Save</button>
          </div>
        </form>
      ) : (
        // Show table only when showForm is false
        <>
          {customers.length === 0 ? (
            <p>Loading customers...</p>
          ) : (
            <>
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.length > 0 ? (
                    currentCustomers.map((customer, index) => (
                      <tr key={customer.user_id}>
                        <td>{indexOfFirstCustomer + index + 1}</td>
                        <td>{`${customer.first_name} ${customer.last_name}`}</td>
                        <td>{customer.email || "N/A"}</td>
                        <td>{customer.phone_number || "N/A"}</td>
                        <td>{`${customer.street}, ${customer.village}, ${customer.taluka}, ${customer.district}, ${customer.state}`}</td>
                        <td>{customer.role || "N/A"}</td>
                        <td>
                          <button className="delete-btn" onClick={() => deleteCustomer(customer.user_id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7">No customers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="pagination">
                {Array.from({ length: Math.ceil(filteredCustomers.length / customersPerPage) }, (_, index) => (
                  <button key={index} onClick={() => paginate(index + 1)} className={currentPage === index + 1 ? "active" : ""}>
                    {index + 1}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
  
};

export default Customer;
