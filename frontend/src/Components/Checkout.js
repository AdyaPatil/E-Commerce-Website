import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Css/Checkout.css";
//import {Backend_url} from  "../../Config/config.json";

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(""); // Track selected payment method
  const [paymentDetails, setPaymentDetails] = useState({
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    upiId: "",
    walletProvider: "",
  });
  const [billingDetails, setBillingDetails] = useState({
    full_name: "",  // Renamed from name
    email: "",
    address: "",
    state: "",
    district: "",
    taluka: "",
    village: "",
    pincode: "",
  });
  const [shippingAddress, setShippingAddress] = useState({
    full_name: "",  // Renamed from name
    email: "",
    address: "",
    state: "",
    district: "",
    taluka: "",
    village: "",
    pincode: "",
  });
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    fetchUserDetails();
    fetchCart();
  }, []);

  useEffect(() => {
    if (sameAsBilling) {
      setShippingAddress({ ...billingDetails });
    } else {
      setShippingAddress({
        name: "",
        email: "",
        address: "",
        state: "",
        district: "",
        taluka: "",
        village: "",
        pincode: "",
      });
    }
  }, [sameAsBilling, billingDetails]);

  const fetchUserDetails = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user_id"));
      if (!storedUser) return console.error("User ID not found in localStorage.");
  
      const token = localStorage.getItem("access_token");
      if (!token) return console.error("No access token found. Please log in.");
  
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/${storedUser}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
  
      if (!response.ok) throw new Error("Failed to fetch user details.");
  
      const userData = await response.json();
      setBillingDetails({
        full_name: `${userData.first_name || ""} ${userData.last_name || ""}`.trim(), // Updated
        email: userData.email || "",
        address: userData.address || "",
        state: userData.state || "",
        district: userData.district || "",
        taluka: userData.taluka || "",
        village: userData.village || "",
        pincode: String(userData.pincode || ""), // Ensure pincode is a string
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };
  

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return alert("Please log in to view your cart.");

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/cart`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch cart items.");

      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handlePaymentSelection = (method) => {
    setSelectedPayment(method);
    if (method === "cod") {
      setPaymentDetails({
        cardName: "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        upiId: "",
        walletProvider: "",
      });
    }
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async () => {
    if (!billingDetails.full_name || !shippingAddress.address) {
      alert("Please fill in all required details before placing the order.");
      return;
    }
  
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Please log in to place an order.");
        return;
      }
  
      const orderPayload = {
        items: cart.map((item) => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total_amount: calculateTotal(),
        billing_details: { ...billingDetails, pincode: String(billingDetails.pincode) }, // Ensure pincode is a string
        shipping_address: { ...shippingAddress, pincode: String(shippingAddress.pincode) },
        payment_method: selectedPayment,
        payment_details: selectedPayment === "cod" ? { cardName: "", cardNumber: "", expiryDate: "", cvv: "", upiId: "", walletProvider: "" } : paymentDetails,
      };
  
      console.log("Order Data:", JSON.stringify(orderPayload, null, 2));
  
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });
  
      if (!response.ok) throw new Error("Order placement failed.");
  
      alert("Order placed successfully!");
      navigate("/order-success");
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    }
  };
  
  

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      <div className="checkout-content">
        {/* Billing Details */}
        <div className="billing-details">
          <h2>Billing Address</h2>
          <form>
            {Object.keys(billingDetails).map((field) => (
              <input
                key={field}
                type="text"
                name={field}
                placeholder={field.replace("_", " ").toUpperCase()}
                value={billingDetails[field]}
                onChange={(e) => setBillingDetails({ ...billingDetails, [e.target.name]: e.target.value })}
                required
              />
            ))}
          </form>
        </div>

        {/* Shipping Address */}
        <div className="billing-details">
          <h2>Shipping Address</h2>
          <div className="checkbox-container" style={{ textAlign: "right" }}>
            <label>
              <input type="checkbox" checked={sameAsBilling} onChange={() => setSameAsBilling(!sameAsBilling)} />
              Shipping Address same as billing
            </label>
          </div>
          <form>
            {Object.keys(shippingAddress).map((field) => (
              <input
                key={field}
                type="text"
                name={field}
                placeholder={field.replace("_", " ").toUpperCase()}
                value={shippingAddress[field]}
                onChange={(e) => setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value })}
                required={!sameAsBilling}
                disabled={sameAsBilling}
              />
            ))}
          </form>
        </div>
      </div>

      {/* Payment Methods Section */}
         {/* Payment Methods Section */}
         <div className="order-summary">
        <h2>Payment Methods</h2>
        <div className="payment-options">
        <label>
            <input
              type="radio"
              name="payment"
              value="cod"
              checked={selectedPayment === "cod"}
              onChange={() => handlePaymentSelection("cod")}
            />
            COD
          </label>
          <label>
            <input
              type="radio"
              name="payment"
              value="card"
              checked={selectedPayment === "card"}
              onChange={() => handlePaymentSelection("card")}
            />
            Credit/Debit Card
          </label>

          <label>
            <input
              type="radio"
              name="payment"
              value="upi"
              checked={selectedPayment === "upi"}
              onChange={() => handlePaymentSelection("upi")}
            />
            UPI/Wallet
          </label>
        </div>

        {/* Credit/Debit Card Form */}
        {selectedPayment === "card" && (
          <div className="payment-form">
            <input
              type="text"
              name="cardName"
              placeholder="Cardholder Name"
              value={paymentDetails.cardName}
              onChange={handlePaymentInputChange}
              required
            />
            <input
              type="text"
              name="cardNumber"
              placeholder="Card Number"
              value={paymentDetails.cardNumber}
              onChange={handlePaymentInputChange}
              required
            />
            <input
              type="text"
              name="expiryDate"
              placeholder="Expiry Date (MM/YY)"
              value={paymentDetails.expiryDate}
              onChange={handlePaymentInputChange}
              required
            />
            <input
              type="password"
              name="cvv"
              placeholder="CVV"
              value={paymentDetails.cvv}
              onChange={handlePaymentInputChange}
              required
            />
          </div>
        )}

        {/* UPI/Wallet Form */}
        {selectedPayment === "upi" && (
          <div className="payment-form">
            <input
              type="text"
              name="upiId"
              placeholder="UPI ID"
              value={paymentDetails.upiId}
              onChange={handlePaymentInputChange}
              required
            />
            <input
              type="text"
              name="walletProvider"
              placeholder="Wallet Provider (e.g., Paytm, PhonePe)"
              value={paymentDetails.walletProvider}
              onChange={handlePaymentInputChange}
              required
            />
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="order-summary">
        <h2>Order Summary</h2>
        <table className="checkout-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.product_id}>
                <td>{item.name}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Total: ${calculateTotal().toFixed(2)}</h3>
        <button className="place-order-btn" onClick={handlePlaceOrder}>
          Place Order
        </button>
      </div>
    </div>
  );
};

export default Checkout;
