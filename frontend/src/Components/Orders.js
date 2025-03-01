import React, { useEffect, useState } from "react";
import "../Css/Orders.css";
//import {Backend_url} from  "../../Config/config.json";

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            const userId = localStorage.getItem("user_id");
            const token = localStorage.getItem("access_token"); // Assuming JWT is stored in localStorage
            
            if (!userId || !token) {
                setError("User not authenticated.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/orders/user/${userId}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch orders");
                }
                const data = await response.json();
                setOrders(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    return (
        <div className="orders-container">
            <h2>Order History</h2>
            {loading ? (
                <p>Loading orders...</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : orders.length === 0 ? (
                <p>No orders found.</p>
            ) : (
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Index</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                            <th>Items</th>
                        </tr>
                    </thead>
                    <tbody>
                    {orders.map((order, index) => (
                            <tr key={order.id}>
                                <td>{index + 1}</td> {/* Sequential numbering */}
                                <td>${order.total_amount}</td>
                                <td>
                                    <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>
                                </td>
                                <td>
                                    <table className="items-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Quantity</th>
                                                <th>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items.map(item => (
                                                <tr key={item.product_id}>
                                                    <td>{item.name}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>${item.price}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Orders;
