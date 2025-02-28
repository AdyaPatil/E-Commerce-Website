import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../Css/Customer.css";
import {Backend_url} from  "../config.json"

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const customersPerPage = 5;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Missing authentication token.");

      const response = await axios.get("${Backend_url}/users/", {
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
    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Missing authentication token.");

      await axios.delete(`${Backend_url}/users/${user_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCustomers(customers.filter((customer) => customer.user_id !== user_id));
      alert("Customer deleted successfully!");
    } catch (err) {
      console.error("Error deleting customer:", err.message);
      alert("Failed to delete customer.");
    }
  };

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  // Filter customers based on search input (name, email, or phone number)
  const filteredCustomers = customers?.filter((customer) =>
    (`${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Pagination logic
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="customer-page">
      <h1>Customers</h1>
      <div className="customer-header">
        <input
          type="text"
          className="search-bar"
          placeholder="Search Customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
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
                    <td>{indexOfFirstCustomer + index + 1}</td> {/* 1, 2, 3, ... */}
                    <td>{`${customer.first_name} ${customer.last_name}`}</td>
                    <td>{customer.email || "N/A"}</td>
                    <td>{customer.phone_number || "N/A"}</td>
                    <td>
                      {`${customer.street}, ${customer.village}, ${customer.taluka}, ${customer.district}, ${customer.state}`}
                    </td>
                    <td>{customer.role || "N/A"}</td>
                    <td>
                      {/* <button className="edit-btn">Edit</button> */}
                      <button className="delete-btn" onClick={() => deleteCustomer(customer.user_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            {Array.from(
              { length: Math.ceil(filteredCustomers.length / customersPerPage) },
              (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => paginate(index + 1)}
                  className={currentPage === index + 1 ? "active" : ""}
                >
                  {index + 1}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Customer;
