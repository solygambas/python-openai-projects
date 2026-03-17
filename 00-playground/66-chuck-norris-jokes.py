import urllib.request
import urllib.parse
import json
import time
import sys
import os
import random

# ANSI Colors
RESET = "\033[0m"
BOLD = "\033[1m"
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"

# Enable ANSI support on Windows 10+
os.system('')

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def print_slow(text, delay=0.03):
    """Prints text character by character for a typewriter effect."""
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()  # Newline at the end

def print_banner():
    """Prints a cool ASCII art banner."""
    banner = f"""{BOLD}{CYAN}
   ___ _  _ _   _  ___ _  __  _  _  ___  ____  ____  ___ ___ 
  / __| || | | | |/ __| |/ / | \| |/ _ \|  _ \|  _ \|_ _/ __|
 | (__| __ | |_| | (__|   <  | .` | (_) | |_) | |_) || |\__ \\
  \___|_||_|\___/ \___|_|\_\ |_|\_|\___/|  _ <|  _ <|___|___/
                                        |_| \_\_| \_\       
    {RESET}"""
    print(banner)

def fetch_json(url):
    """Helper to fetch JSON from a URL."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"{RED}Error fetching data: {e}{RESET}")
        return None

def get_categories():
    """Fetches available joke categories."""
    return fetch_json("https://api.chucknorris.io/jokes/categories")

def get_joke(category=None, query=None):
    """Fetches a joke, optionally by category or search query."""
    base_url = "https://api.chucknorris.io/jokes"
    
    if query:
        # Search returns a list, we pick one random result
        data = fetch_json(f"{base_url}/search?query={urllib.parse.quote(query)}")
        if data and data.get('total', 0) > 0:
            return random.choice(data['result'])['value']
        elif data:
            return f"No jokes found for '{query}'."
        else:
            return None
    elif category:
        data = fetch_json(f"{base_url}/random?category={category}")
        return data['value'] if data else None
    else:
        data = fetch_json(f"{base_url}/random")
        return data['value'] if data else None

def main_menu():
    """Displays the main menu and handles user input."""
    categories = get_categories() or []
    
    while True:
        clear_screen()
        print_banner()
        print(f"{YELLOW}Select an option:{RESET}")
        print("1. Get a Random Joke")
        print("2. Pick a Category")
        print("3. Search for a Joke")
        print("4. Exit")
        
        choice = input(f"\n{BOLD}>> {RESET}").strip()
        
        if choice == '1':
            joke = get_joke()
            if joke:
                print(f"\n{GREEN}", end="")
                print_slow(joke)
                print(f"{RESET}")
            input(f"\n{CYAN}Press Enter to continue...{RESET}")
            
        elif choice == '2':
            if not categories:
                print(f"{RED}Could not load categories.{RESET}")
                input(f"\n{CYAN}Press Enter to continue...{RESET}")
                continue
                
            print(f"\n{YELLOW}Available Categories:{RESET}")
            # Print categories in columns
            for i, cat in enumerate(categories):
                print(f"{i+1:2d}. {cat:<15}", end="")
                if (i + 1) % 3 == 0:
                    print()
            print()
            
            cat_choice = input(f"\n{BOLD}Enter category number or name: {RESET}").strip()
            
            selected_cat = None
            if cat_choice.isdigit():
                idx = int(cat_choice) - 1
                if 0 <= idx < len(categories):
                    selected_cat = categories[idx]
            elif cat_choice in categories:
                selected_cat = cat_choice
            
            if selected_cat:
                joke = get_joke(category=selected_cat)
                if joke:
                    print(f"\n{GREEN}", end="")
                    print_slow(joke)
                    print(f"{RESET}")
            else:
                print(f"{RED}Invalid category.{RESET}")
            
            input(f"\n{CYAN}Press Enter to continue...{RESET}")

        elif choice == '3':
            query = input(f"\n{BOLD}Enter search term: {RESET}").strip()
            if query:
                joke = get_joke(query=query)
                if joke:
                    print(f"\n{GREEN}", end="")
                    print_slow(joke)
                    print(f"{RESET}")
            input(f"\n{CYAN}Press Enter to continue...{RESET}")

        elif choice == '4':
            print(f"\n{BOLD}Chuck Norris doesn't say goodbye. He just disappears.{RESET}")
            break
            
        else:
            input(f"\n{RED}Invalid option. Press Enter...{RESET}")

if __name__ == "__main__":
    try:
        main_menu()
    except KeyboardInterrupt:
        print(f"\n{BOLD}Chuck Norris caught you trying to escape.{RESET}")
