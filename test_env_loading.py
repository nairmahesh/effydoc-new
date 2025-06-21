import os
from dotenv import load_dotenv
from pathlib import Path

# Print current directory
print(f"Current directory: {os.getcwd()}")

# Try to load .env file from backend directory
backend_dir = Path("/app/backend")
env_path = backend_dir / '.env'
print(f"Trying to load .env from: {env_path}")
load_dotenv(env_path)

# Check if OPENAI_API_KEY is loaded
openai_api_key = os.getenv("OPENAI_API_KEY")
print(f"OPENAI_API_KEY loaded: {bool(openai_api_key)}")
if openai_api_key:
    # Print first few characters for verification (don't print the whole key)
    print(f"OPENAI_API_KEY starts with: {openai_api_key[:10]}...")

# Check other environment variables
mongo_url = os.getenv("MONGO_URL")
print(f"MONGO_URL loaded: {bool(mongo_url)}")
if mongo_url:
    print(f"MONGO_URL: {mongo_url}")

db_name = os.getenv("DB_NAME")
print(f"DB_NAME loaded: {bool(db_name)}")
if db_name:
    print(f"DB_NAME: {db_name}")

secret_key = os.getenv("SECRET_KEY")
print(f"SECRET_KEY loaded: {bool(secret_key)}")
if secret_key:
    print(f"SECRET_KEY starts with: {secret_key[:10]}...")