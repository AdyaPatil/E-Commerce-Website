import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Dashboard from "./Dashboard";
import Orders from "./Orders";
import Customers from "./Customers";
import Products from "./Products";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedProduct, setSelectedProduct] = useState(null); // Store selected product

  return (
    <div className="admin-container">
      <Sidebar setActivePage={setActivePage} />
      <Navbar />
      <div className="content">
        {activePage === "dashboard" && <Dashboard />}
        {activePage === "orders" && <Orders />}
        {activePage === "customers" && <Customers />}
        {activePage === "products" && (
          <Products setActivePage={setActivePage} setSelectedProduct={setSelectedProduct} />
        )}
        {activePage === "addproduct" && <AddProduct />}
        {activePage === "editproduct" && <EditProduct product={selectedProduct} />}
      </div>
    </div>
  );
};

export default AdminDashboard;
