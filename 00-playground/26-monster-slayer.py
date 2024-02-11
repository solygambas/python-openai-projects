import random

HEART_EMOJI = "❤️"


# Welcome message
def welcome_message():
    print("Welcome to Monster Slayer!")


# Get username from user
def get_username():
    username = input("Enter your username: ")
    return username


# Get difficulty level from user
def get_difficulty():
    print("\nChoose a difficulty level:")
    print("1. Easy")
    print("2. Normal")
    print("3. Hard")
    while True:
        difficulty = input(
            "Enter the number corresponding to your chosen difficulty (1-3): "
        )
        if difficulty in ["1", "2", "3"]:
            break
        else:
            print("Invalid difficulty level. Please choose again.")
    return difficulty


# Initialize player and monster health
def initialize_health():
    player_health = 100
    monster_health = 100
    return player_health, monster_health


# Main game logic
def play_game():
    welcome_message()
    username = get_username()
    difficulty = get_difficulty()
    player_health, monster_health = initialize_health()

    # Game rounds loop
    round_count = 1
    player_turn = True
    while player_health > 0 and monster_health > 0:
        print(f"\n----- Round {round_count} -----")
        print(
            f"{username}'s health: {HEART_EMOJI} {player_health}\tMonster health: {HEART_EMOJI} {monster_health}\n"
        )

        # Player's turn
        if player_turn:
            print("Your turn:")
            print("Choose your action:")
            print("1. Regular Attack")
            if round_count == 1 or round_count % 3 == 0:
                print("2. Strong Attack")
            if round_count == 1 or round_count % 5 == 0:
                print("3. Heal")
            while True:
                action = input("Enter the number corresponding to your action (1-3): ")
                if action in ["1", "2", "3"]:
                    break
                else:
                    print("Invalid action. Please choose again.")

            if action == "1":
                damage = random.randint(10, 15)
                monster_health -= damage
                print(f"You dealt {damage} damage to the monster!")
            elif action == "2" and (round_count == 1 or round_count % 3 == 0):
                damage = random.randint(20, 25)
                monster_health -= damage
                print(f"You dealt {damage} damage to the monster with a strong attack!")
            elif action == "3" and (round_count == 1 or round_count % 5 == 0):
                healing = random.randint(15, 20)
                player_health += healing
                print(f"You healed for {healing} health points!")
            else:
                print("Invalid action. Skipping your turn...")

        # Monster's turn
        else:
            print("Monster's turn:")
            damage = random.randint(10, 20)
            player_health -= damage
            print(f"The monster attacked you and dealt {damage} damage!")

        player_turn = not player_turn
        round_count += 1

        # Check if game is over
        if player_health <= 0:
            print("You have been defeated! The monster wins!")
            break
        elif monster_health <= 0:
            print("Congratulations! You have slain the monster!")
            break

    # Manage high score
    with open("scores/high_score.txt", "a") as file:
        file.write(f"{username}: {round_count-1} rounds\n")

    print("\nHigh Scores:")
    with open("scores/high_score.txt", "r") as file:
        high_scores = file.read()
        print(high_scores)

    # Ask for a new game
    play_again = input("Do you want to play again? (yes/no): ")
    if play_again.lower() == "yes":
        play_game()
    else:
        print("Thank you for playing Monster Slayer!")


play_game()
