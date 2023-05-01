def print_board(board: list[str]) -> None:
    print("   |   |")
    print(f" {board[0]} | {board[1]} | {board[2]}")
    print("   |   |")
    print("-----------")
    print("   |   |")
    print(f" {board[3]} | {board[4]} | {board[5]}")
    print("   |   |")
    print("-----------")
    print("   |   |")
    print(f" {board[6]} | {board[7]} | {board[8]}")
    print("   |   |")


def check_win(board: list[str], player: str) -> bool:
    if (
        (board[0] == player and board[1] == player and board[2] == player)
        or (board[3] == player and board[4] == player and board[5] == player)
        or (board[6] == player and board[7] == player and board[8] == player)
        or (board[0] == player and board[3] == player and board[6] == player)
        or (board[1] == player and board[4] == player and board[7] == player)
        or (board[2] == player and board[5] == player and board[8] == player)
        or (board[0] == player and board[4] == player and board[8] == player)
        or (board[2] == player and board[4] == player and board[6] == player)
    ):
        return True
    else:
        return False


def tic_tac_toe() -> None:
    board = [" ", " ", " ", " ", " ", " ", " ", " ", " "]
    players = ["X", "O"]
    current_player = players[0]
    while True:
        print_board(board)
        print(f"It's {current_player}'s turn.")
        choice = input("Enter a position (1-9): ")
        if not choice.isdigit() or int(choice) not in range(1, 10):
            print("Invalid choice. Try again.")
            continue
        position = int(choice) - 1
        if board[position] != " ":
            print("That position is already taken. Try again.")
            continue
        board[position] = current_player
        if check_win(board, current_player):
            print_board(board)
            print(current_player + " wins!")
            break
        if " " not in board:
            print_board(board)
            print("It's a tie!")
            break
        current_player = players[(players.index(current_player) + 1) % 2]


if __name__ == "__main__":
    tic_tac_toe()
