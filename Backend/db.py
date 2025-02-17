import json
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB client
try:
    with open("config.json", "r") as config_file:
        config = json.load(config_file)
    
        client = AsyncIOMotorClient(config["MONGO_DB_URL"])
        database = client[config["DATABASE_NAME"]]
except Exception as e:
    print(e)
    
    
     # Collections
       
 # Collections
users_collection = database["users"]  # Users collection
products_collection = database["products"]  # Products collection
categories_collection = database["categories"]  # Categories collection
shopping_cart_collection = database["shopping_cart"] # Cart collection
orders_collection = database["orders"]  # Orders collection 
payments_collection = database["payments"]  # Payments collection
reviews_collection = database["reviews"]  # Reviews collection
contact_collection = database["contacts"] # Contact Collection


