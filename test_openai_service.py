import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import importlib.util

# Add the backend directory to Python path
backend_dir = Path("/app/backend")
sys.path.append(str(backend_dir))

# Load environment variables
env_path = backend_dir / '.env'
print(f"Loading .env from: {env_path}")
load_dotenv(env_path)

# Check if OPENAI_API_KEY is loaded
openai_api_key = os.getenv("OPENAI_API_KEY")
print(f"OPENAI_API_KEY loaded: {bool(openai_api_key)}")
if openai_api_key:
    print(f"OPENAI_API_KEY starts with: {openai_api_key[:10]}...")

# Import the OpenAI service module
try:
    # Try to import the module
    spec = importlib.util.spec_from_file_location("openai_service", backend_dir / "openai_service.py")
    openai_service_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(openai_service_module)
    
    # Access the openai_service instance
    openai_service = openai_service_module.openai_service
    
    # Check if the client is initialized
    print(f"OpenAI client initialized: {bool(openai_service.client)}")
    print(f"OpenAI API key set in service: {bool(openai_service.api_key)}")
    
    # Reinitialize the client
    print("\nReinitializing OpenAI client...")
    openai_service.initialize_client()
    
    # Check again
    print(f"OpenAI client initialized after reinitialization: {bool(openai_service.client)}")
    print(f"OpenAI API key set in service after reinitialization: {bool(openai_service.api_key)}")
    
except Exception as e:
    print(f"Error importing or using OpenAI service: {e}")