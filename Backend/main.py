from fastapi import FastAPI
from routes.auth import router as auth_routes
from routes.user import router as user_routes  
from routes.products import router as products_routes
from routes.category import router as category_routes
from routes.cart import router as cart_routes
from routes.orders import router as order_routes
from routes.payment import router as payment_routes
from routes.review import router as review_routes
from routes.admindashboard import router as admin_routes
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json

# Initialize the main FastAPI app
app = FastAPI()

# Include both auth and user routes
app.include_router(auth_routes)
app.include_router(user_routes)
app.include_router(products_routes)
app.include_router(category_routes)
app.include_router(cart_routes)
app.include_router(order_routes)
app.include_router(payment_routes)
app.include_router(review_routes)
app.include_router(admin_routes)


# Enable CORS for React integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to the eCommerce API!"}


# Main entry point
if __name__ == "__main__":
    uvicorn.run(app="main:app", host="127.0.0.1", port=8000, reload=True)