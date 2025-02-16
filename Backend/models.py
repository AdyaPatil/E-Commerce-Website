from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


# User Model Start
class UserProfile(BaseModel):
    user_id: Optional[int]
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    street: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    taluka: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[int] = None
    role: str = "customer"

class UserUpdateRequest(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    street: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    taluka: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[int] = None
    role: str = "customer"
    
class UpdateUserResponse(BaseModel):
    message: str
    updated_user: UserProfile

# User Model Stop
    
#------------------------------------------------------------------------------------------------------------#      

# Category Model Start
class Category(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CategoryResponse(Category):
    category_id: str
    
# Category Model Stop
    
#------------------------------------------------------------------------------------------------------------#      

# Subcategory model
class Subcategory(BaseModel):
    subcategory_id: str = Field(..., description="Unique ID for the subcategory")
    name: str
    description: Optional[str] = None
    category_id: str  # Link to a parent category


# Product Model Start
class ProductResponse(BaseModel):
    product_id: str  # This will be auto-generated and returned
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    category_id: str
    category_name: str
    image_url: Optional[str] = None

    class Config:
        json_encoders = {
            ObjectId: str
        }


class Product(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    category_id: str
    image_url: Optional[str] = None


class ProductUpdateRequest(BaseModel):
    name: Optional[str]
    description: Optional[str]
    price: Optional[float]
    stock: Optional[int]
    category_id: Optional[str]
    image_url: Optional[str]
    
# Product Model Stop
    
#------------------------------------------------------------------------------------------------------------#      

# Order Model Start
class Order(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int


class BillingDetails(BaseModel):
    full_name: str
    email: str
    address: str
    state: str
    district: str
    taluka: str
    village: str
    pincode: str

class OrderRequest(BaseModel):
    items: List[Order]  # List of items in the order
    total_amount: float  # Total price for the order
    shipping_address: str  # Address where the order should be delivered
    billing_details: BillingDetails  # Billing details of the user


class OrderResponse(BaseModel):
    order_id: str
    user_id: str
    items: List[Order]
    total_amount: float
    shipping_address: str
    status: str
    created_date: datetime
    updated_date: Optional[datetime] = None

# Order Model Stop

#------------------------------------------------------------------------------------------------------------#  

# Cart Model Start
class ShoppingCart(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    created_date: datetime


class CartItemResponse(BaseModel):
    cart_id: str
    product_id: str
    user_id: str
    name: str
    price: float
    quantity: int
    created_date: datetime

class UpdateCartItemRequest(BaseModel):
    quantity: int
# Cart Model Start

#------------------------------------------------------------------------------------------------------------#  

# Payment Model Start
class Payment(BaseModel):
    order_id: str
    amount: float
    payment_method: str  # Example: "credit_card", "paypal", etc.
    billing_address: Optional[str]


class PaymentResponse(BaseModel):
    payment_id: str
    order_id: str
    user_id: str
    amount: float
    payment_method: str
    billing_address: Optional[str]
    status: str  # Example: "Success", "Failed", "Pending"
    created_date: datetime
    
# Payment Model Stop
    
#------------------------------------------------------------------------------------------------------------#    

# Review Model Start
class Review(BaseModel):
    product_id: str
    rating: int
    review: Optional[str]

class ReviewResponse(BaseModel):
    review_id: str
    product_id: str
    user_id: str
    rating: int
    review: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

# Review Model Stop

#------------------------------------------------------------------------------------------------------------#   

# Admin Dasahboard Analytics Model Start
class AdminAnalyticsResponse(BaseModel):
    total_revenue: float
    total_users: int
    total_orders: int
    total_products: int
    
# Admin Dasahboard Analytics Model Start

#------------------------------------------------------------------------------------------------------------#   

# Contact Model Start
class Contactquery(BaseModel):
    name: str
    email: str
    message: str
# Contact Model Stop




