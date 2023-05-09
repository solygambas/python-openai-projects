class Person:
    def __init__(self, name, age, gender):
        self.name = name
        self.age = age
        self.gender = gender

    def get_name(self):
        return self.name

    def set_name(self, name):
        self.name = name

    def get_age(self):
        return self.age

    def set_age(self, age):
        self.age = age

    def get_gender(self):
        return self.gender

    def set_gender(self, gender):
        self.gender = gender


if __name__ == '__main__':
    # Create a new Person object
    person = Person('Alice', 25, 'female')

    # Test the get/set methods
    assert person.get_name() == 'Alice'
    assert person.get_age() == 25
    assert person.get_gender() == 'female'

    person.set_name('Bob')
    person.set_age(30)
    person.set_gender('male')

    assert person.get_name() == 'Bob'
    assert person.get_age() == 30
    assert person.get_gender() == 'male'

    print('All tests passed!')