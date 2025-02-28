import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../Css/Order.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrdersAndUsers();
  }, []);

  const fetchOrdersAndUsers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Missing authentication token.");

      const [ordersResponse, usersResponse] = await Promise.all([
        axios.get("http://127.0.0.1:8000/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://127.0.0.1:8000/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const usersMap = {};
      usersResponse.data.forEach((user) => {
        usersMap[String(user.user_id)] = `${user.first_name} ${user.last_name}`;
      });

      setUsers(usersMap);
      setOrders(ordersResponse.data);
    } catch (err) {
      console.error("Error fetching data:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (user_id) => users[String(user_id)] || "Unknown";

  const deleteOrder = async (order_id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Missing authentication token.");

      await axios.delete(`http://127.0.0.1:8000/orders/${order_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(orders.filter((order) => order.order_id !== order_id));
      alert("Order deleted successfully!");
    } catch (err) {
      console.error("Error deleting order:", err.message);
      alert("Failed to delete order.");
    }
  };

  const updateOrderStatus = async (order_id, newStatus) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Missing authentication token.");

      await axios.put(
        `http://127.0.0.1:8000/orders/${order_id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders(
        orders.map((order) =>
          order.order_id === order_id ? { ...order, status: newStatus } : order
        )
      );
      alert("Order status updated successfully!");
    } catch (err) {
      console.error("Error updating order status:", err.message);
      alert("Failed to update order status.");
    }
  };

  const getAvailableStatusOptions = (currentStatus) => {
    const statusFlow = ["Pending", "Shipped", "Completed", "Cancelled"];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return statusFlow.slice(currentIndex + 1);
  };

  if (loading) {
    return <div className="loading-message">Loading orders...</div>;
  }

  return (
    <div className="orders-page">
      <h1>Orders</h1>

      <div className="orders-header">
        <input
          type="text"
          className="search-bar"
          placeholder="Search by User ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <div className="error-message">Error: {error}</div>}

      <table className="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>User Name</th>
            <th>Items</th>
            <th>Total Amount</th>
            <th>Shipping Address</th>
            <th>Status</th>
            <th>Created Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <tr key={order.order_id}>
                <td>{order.order_id}</td>
                <td>{getUserName(order.user_id)}</td>
                <td>
                  {order.items.map((item, index) => (
                    <div key={index}>{item.name} (x{item.quantity})</div>
                  ))}
                </td>
                <td>{order.total_amount}</td>
                <td>
                  {order.shipping_address ? (
                    <>
                      {order.shipping_address.address}, {order.shipping_address.village},
                      {order.shipping_address.taluka}, {order.shipping_address.district},
                      {order.shipping_address.state} - {order.shipping_address.pincode}
                    </>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>
                  <select
                    value={order.status || "Pending"}
                    onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                  >
                    <option value={order.status} disabled>
                      {order.status}
                    </option>
                    {getAvailableStatusOptions(order.status).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{new Date(order.created_date).toLocaleString()}</td>
                <td>
                  <button className="delete-btn" onClick={() => deleteOrder(order.order_id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Orders;
