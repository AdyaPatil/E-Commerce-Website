from fastapi import APIRouter, HTTPException, Depends, status
from db import users_collection, payments_collection, products_collection, orders_collection
from models import AdminAnalyticsResponse, OrderResponse, UserProfile
from .auth import get_current_user 
from typing import List


router = APIRouter()


@router.get("/admin/analytics", response_model=AdminAnalyticsResponse, status_code=status.HTTP_200_OK)
async def get_analytics(current_user: dict = Depends(get_current_user)):
    try:
        # Ensure the current user is an admin
        if str(current_user["role"]) != "admin":
            raise HTTPException(status_code=403, detail="Access forbidden")

        # Sales stats
        total_sales = await payments_collection.aggregate([
            {"$group": {"_id": None, "total_revenue": {"$sum": "$amount"}}}
        ]).to_list(1)
        total_revenue = total_sales[0]["total_revenue"] if total_sales else 0

        # User stats
        total_users = await users_collection.count_documents({})
        total_orders = await orders_collection.count_documents({})
        total_products = await products_collection.count_documents({})

        analytics = {
            "total_revenue": total_revenue,
            "total_users": total_users,
            "total_orders": total_orders,
            "total_products": total_products,
        }

        return AdminAnalyticsResponse(**analytics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve analytics: {str(e)}")

@router.get("/admin/orders", response_model=List[OrderResponse], status_code=status.HTTP_200_OK)
async def get_all_orders(current_user: dict = Depends(get_current_user)):
    try:
        # Ensure the current user is an admin
        if str(current_user["role"]) != "admin":
            raise HTTPException(status_code=403, detail="Access forbidden")

        # Fetch all orders from MongoDB
        orders = await orders_collection.find().to_list(100)

        # Transform data to match Pydantic model
        transformed_orders = []
        for order in orders:
            if "shipping_address" in order:
                # Ensure 'full_name' exists and convert 'pincode' to string
                shipping_address = order["shipping_address"]
                shipping_address["full_name"] = shipping_address.pop("name", "")
                shipping_address["pincode"] = str(shipping_address["pincode"])

            if "billing_details" in order:
                # Ensure 'full_name' exists and convert 'pincode' to string
                billing_details = order["billing_details"]
                billing_details["full_name"] = billing_details.pop("name", "")
                billing_details["pincode"] = str(billing_details["pincode"])

            # Create a valid OrderResponse
            transformed_orders.append(OrderResponse(**order))

        return transformed_orders

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve orders: {str(e)}")


@router.get("/admin/users", response_model=List[UserProfile], status_code=status.HTTP_200_OK)
async def get_all_users(current_user: dict = Depends(get_current_user)):
    try:
        # Ensure the current user is an admin
        if str(current_user["role"]) != "admin":
            raise HTTPException(status_code=403, detail="Access forbidden")

        # Fetch all users
        users = await users_collection.find().to_list(100)  # Limit to 100 for pagination
        return [UserProfile(**user) for user in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve users: {str(e)}")

