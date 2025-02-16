from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_DB_URL, DATABASE_NAME

# MongoDB client
client = AsyncIOMotorClient(MONGO_DB_URL)
database = client[DATABASE_NAME]

# Collections
users_collection = database["users"]  # Users collection
products_collection = database["products"]  # Products collection
categories_collection = database["categories"]  # Categories collection
shopping_cart_collection = database["shopping_cart"] # Cart collection
orders_collection = database["orders"]  # Orders collection 
payments_collection = database["payments"]  # Payments collection
reviews_collection = database["reviews"]  # Reviews collection
contact_collection = database["contacts"] # Contact Collection
