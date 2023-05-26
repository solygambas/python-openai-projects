import random
from datetime import datetime, timedelta


def generate_dummy_data(n):
    identifiers = ["ACAD", "LEARN", "DUMMY"]
    start_date = datetime.now().date()
    stock_data = []

    for i in range(n):
        current_date = start_date + timedelta(days=i)
        for identifier in identifiers:
            if i == 0:
                price = round(random.uniform(50, 200), 2)
            else:
                prev_price = next(
                    (
                        data[1]
                        for data in stock_data
                        if data[0] == identifier
                        and data[2] == current_date - timedelta(days=1)
                    ),
                    None,
                )
                if prev_price is None:
                    price = round(random.uniform(50, 200), 2)
                else:
                    price = round(prev_price + random.uniform(-5, 5), 2)

            stock_data.append((identifier, price, current_date))

    return stock_data


if __name__ == "__main__":
    n = input("Enter the number of dates for which data points should be generated: ")

    dummy_data = generate_dummy_data(
        int(n)
    )  # Convert the user input to an integer using int()
    for data_point in dummy_data:
        print(data_point)
