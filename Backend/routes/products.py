from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from db import products_collection, categories_collection
from models import Product, ProductResponse, ProductUpdateRequest
from typing import List
from .auth import get_current_user  # Assuming the authentication route is implemented elsewhere
import boto3
import os


router = APIRouter()


# Function to get the next product_id by finding the max value of current product_ids
async def get_next_product_id():
    last_product = await products_collection.find_one(
        {}, 
        projection={"product_id": 1}, 
        sort=[("product_id", -1)]  # Sort by product_id in descending order
    )
    
    if last_product and last_product["product_id"].isdigit():
        # Convert product_id to integer and increment by 1 if it is a valid integer string
        return str(int(last_product["product_id"]) + 1)  # Convert back to string
    else:
        # Return "1" as the starting product_id if no valid product_id is found
        return "1"  # Ensure it is returned as a string


s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AKIAQUFLQGAZUGO4UYX7"),
    aws_secret_access_key=os.getenv("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"),
    region_name="eu-north-1"
)
BUCKET_NAME = "product-images-adinath-2025"


@router.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    try:
        file_key = f"products/{file.filename}"  # Define file path in S3
        s3_client.upload_fileobj(file.file, BUCKET_NAME, file_key)  # ❌ Remove ACL

        image_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_key}"
        return {"image_url": image_url}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Post request to add a new product
@router.post("/products/", response_model=ProductResponse, status_code=status.HTTP_200_OK)
async def add_product(product: Product, current_user: dict = Depends(get_current_user)):
    print("API endpoint hit!")  # Ensure this print statement is visible in your logs

    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")

        # Get the next product_id by finding the maximum existing product_id
        product_id = await get_next_product_id()

        print(f"Fetching category for category_id: {product.category_id}")
        category = await categories_collection.find_one({"category_id": product.category_id})
        print(f"Category found: {category}")  # Debug the fetched category

        if category:
            category_name = category.get("name", "Unknown Category")  # Use "name" instead of "category_name"
        else:
            category_name = "Unknown Category"  # Default value if category not found
        
        print(f"Fetched category_name: {category_name}")

        # Construct the product data including category_name
        new_product = {
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock": product.stock,
            "category_id": product.category_id,
            "category_name": category_name,  # Ensure category_name is included
            "image_url": product.image_url,
            "product_id": product_id  # Add custom product_id to the product
        }

        print(f"New product data: {new_product}")

        # Insert the product into the MongoDB collection
        await products_collection.insert_one(new_product)

        # Create and return the response with all necessary fields
        response_product = ProductResponse(
            product_id=str(new_product["product_id"]),
            name=new_product["name"],
            description=new_product["description"],
            price=new_product["price"],
            stock=new_product["stock"],
            category_id=new_product["category_id"],
            category_name=new_product["category_name"],
            image_url=new_product["image_url"]
        )

        print(f"Response product: {response_product}")

        return response_product

    except Exception as e:
        print(f"Error occurred: {e}")  # Log any errors
        raise HTTPException(status_code=500, detail=str(e))



# Assuming you have a categories collection
@router.get("/products/", response_model=List[ProductResponse], status_code=status.HTTP_200_OK)
async def get_all_products():
    try:
        products = await products_collection.find().to_list(100)  # Retrieve up to 100 products
        
        # Create a list to store the updated product data with category names
        enriched_products = []
        
        for product in products:
            # Fetch the category based on the category_id
            category = await categories_collection.find_one({"category_id": product["category_id"]})
            
            if not category:
                raise HTTPException(status_code=404, detail=f"Category not found for ID {product['category_id']}")
            
            # Add the category name to the product data
            product["category_name"] = category["name"]
            enriched_products.append(ProductResponse(**product))
            
        
        return enriched_products

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get product details by product_id
@router.get("/products/{product_id}", response_model=ProductResponse, status_code=status.HTTP_200_OK)
async def get_product_details(product_id: str):
    try:
        # Query by 'product_id' field instead of '_id'
        product = await products_collection.find_one({"product_id": product_id})
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Return the product details
        return ProductResponse(**product)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update product details
@router.put("/products/{product_id}", response_model=ProductResponse, status_code=status.HTTP_200_OK)
async def update_product(
    product_id: str,
    product_update: ProductUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")

        # Find the product by product_id (not by _id)
        product = await products_collection.find_one({"product_id": product_id})

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Create a dictionary with only the updated fields (exclude unset fields)
        update_fields = product_update.dict(exclude_unset=True)

        # If no fields are provided for update
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        # If category_id is updated, fetch the category name
        category_name = product.get("category_name", "")  # Default to existing category_name

        if "category_id" in update_fields:
            category = await categories_collection.find_one({"category_id": update_fields["category_id"]})
            if not category:
                raise HTTPException(status_code=404, detail="Category not found")
            category_name = category["name"]  # Fetch category name

            # Include category_name in update fields
            update_fields["category_name"] = category_name

        # Update only the fields that are provided
        await products_collection.update_one(
            {"product_id": product_id},
            {"$set": update_fields}
        )

        # Fetch the updated product
        updated_product = await products_collection.find_one({"product_id": product_id})

        return ProductResponse(**updated_product)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




# Delete a product by product_id
@router.delete("/products/{product_id}", response_model=dict, status_code=status.HTTP_200_OK)
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")

        # Find the product by product_id (not by _id)
        product = await products_collection.find_one({"product_id": product_id})

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Delete the product by product_id
        await products_collection.delete_one({"product_id": product_id})

        return {"message": "Product deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


