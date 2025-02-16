import jwt
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from db import users_collection
from models import UserProfile  
from fastapi.encoders import jsonable_encoder
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from typing import Optional
from pymongo import ASCENDING
from datetime import datetime, timedelta

# In-memory blacklist (use Redis or database in production)
blacklisted_tokens = set()

# Pydantic model for user response (excluding password)
class UserResponse(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None
    role: str

# Pydantic model for login request
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# FastAPI instance
router = APIRouter()

# Secret key for JWT
SECRET_KEY = "your_secret_key_here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Ensure MongoDB index exists
async def create_indexes():
    await users_collection.create_index([("user_id", ASCENDING)], unique=True)

@router.on_event("startup")
async def on_startup():
    await create_indexes()

# Hash password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Verify password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Fetch user by email
async def get_user_by_email(email: str):
    return await users_collection.find_one({"email": email})

# Generate JWT token
def create_jwt_token(user_id: str):
    expiration = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": user_id,
        "exp": expiration.timestamp(),  # Ensure it's a timestamp
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# Decode JWT token
def decode_jwt_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if token in blacklisted_tokens:  # Check if token is blacklisted
            raise HTTPException(status_code=401, detail="Token has been revoked. Please log in again.")
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Dependency to get current user from JWT token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    user_id = decode_jwt_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    
    user = await users_collection.find_one({"user_id": int(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

# 1. Register User
@router.post("/auth/register")
async def create_user(user: UserProfile):
    hashed_password = hash_password(user.password)
    
    last_user = await users_collection.find_one(sort=[("user_id", -1)])
    next_user_id = 1 if last_user is None else last_user["user_id"] + 1

    user_data = jsonable_encoder(user)
    user_data["user_id"] = next_user_id
    user_data["password"] = hashed_password
    user_data.setdefault("role", "customer")

    result = await users_collection.insert_one(user_data)

    # Convert ObjectId to string
    user_data["_id"] = str(result.inserted_id)
    user_data.pop("password", None)  # Remove password before returning

    return user_data



# 2. Login User
@router.post("/auth/login")
async def authenticate_user(login_request: LoginRequest):
    user = await get_user_by_email(login_request.email)
    
    if not user or not verify_password(login_request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_jwt_token(str(user["user_id"]))

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "address": user.get("address"),
            "phone_number": user.get("phone_number"),
            "role": user["role"]
        }
    }

# 3. Get Current User
@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

# 4. Logout User (invalidate token)
@router.post("/auth/logout")
async def logout_user(token: str = Depends(oauth2_scheme)):
    user_id = decode_jwt_token(token)

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await users_collection.find_one({"user_id": int(user_id)}, {"username": 1, "email": 1})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    blacklisted_tokens.add(token)  # Add token to blacklist

    return {
        "message": "User logged out successfully",
        "user": {
            "email": user["email"]
        }
    }
