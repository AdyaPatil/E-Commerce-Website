import React, { useEffect, useState } from "react";
import "../../Css/Admin.css";
//import {Backend_url} from  "../../../config.json"

const Dashboard = () => {
  const [analytics, setAnalytics] = useState({
    total_revenue: 0,
    total_users: 0,
    total_orders: 0,
    total_products: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token"); // Retrieve token from localStorage

    fetch(`${process.env.REACT_APP_BACKEND_URL}/admin/analytics`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Include Authorization header
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }
        return response.json();
      })
      .then((data) => {
        setAnalytics(data);
      })
      .catch((error) => console.error("Error fetching analytics:", error));
  }, []);

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="cards">
        <div className="card">Total Sales: ${analytics.total_revenue}</div>
        <div className="card">New Users: {analytics.total_users}</div>
        <div className="card">Pending Orders: {analytics.total_orders}</div>
        <div className="card">Total Products: {analytics.total_products}</div>
      </div>
      <div className="recent-orders">
        <h2>Recent Orders</h2>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>001</td>
              <td>Jane Doe</td>
              <td>Completed</td>
            </tr>
            <tr>
              <td>002</td>
              <td>John Smith</td>
              <td>Pending</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
