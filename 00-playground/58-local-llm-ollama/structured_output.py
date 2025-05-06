import requests
import json

url = "http://localhost:11434/api/generate"

model_name = "gemma3:12b-it-qat" 

prompt = """
Generate a JSON list containing 3 fictional users.
Each user must have a firstName, lastName, birthdate (in YYYY-MM-DD format), and country.
Return that data as JSON.
"""

json_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "firstName": {"type": "string", "description": "First name of the user"},
            "lastName": {"type": "string", "description": "Last name of the user"},
            "birthdate": {"type": "string", "description": "Format: YYYY-MM-DD"},
            "country": {"type": "string", "description": "Country of the user"}
        },
        "required": ["firstName", "lastName", "birthdate", "country"]
    }
}

payload = {
    "model": model_name,
    "prompt": prompt,
    "format": json_schema, 
    "stream": False 
}

headers = {'Content-Type': 'application/json'}
try:
    
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    response.raise_for_status() 
    
    response_data = response.json()
    
    if 'response' in response_data:
        try:
            structured_output = json.loads(response_data['response'])
            print("Successfully received structured output:")
            print(json.dumps(structured_output, indent=2))
        except json.JSONDecodeError:
            print("Error: Could not parse the inner JSON response string.")
            print("Raw response string:", response_data['response'])
    else:
        print("Error: 'response' field not found in the API response.")
        print("Full API response:", response_data)

except requests.exceptions.RequestException as e:
    print(f"Error making request to Ollama API: {e}")
except json.JSONDecodeError:
    print("Error: Could not parse the outer JSON response from Ollama API.")
    print("Raw response content:", response.text)
except Exception as e:
    print(f"An unexpected error occurred: {e}")


# [
#   {
#     "firstName": "Anya",
#     "lastName": "Volkov",
#     "birthdate": "1995-07-12",
#     "country": "Russia"
#   },
#   {
#     "firstName": "Kenji",
#     "lastName": "Tanaka",
#     "birthdate": "1988-03-28",
#     "country": "Japan"
#   },
#   {
#     "firstName": "Chloe",
#     "lastName": "O'Connell",
#     "birthdate": "2001-11-05",
#     "country": "Ireland"
#   }
# ]