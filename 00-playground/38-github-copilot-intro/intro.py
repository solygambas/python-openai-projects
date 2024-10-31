def convert_f_to_c(f):
    return (f - 32) * 5/9

# Function that ethier converts fahrenheit to celsius or celsius to fahrenheit

def convert(temp, unit):
    if unit == "f":
        return convert_f_to_c(temp)
    else:
        return (temp * 9/5) + 32
    else:
        return "Invalid unit"