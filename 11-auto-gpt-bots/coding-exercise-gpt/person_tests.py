import unittest
from person_solution import Person

class TestPerson(unittest.TestCase):
    def test_get_name(self):
        person = Person('Alice', 25, 'female')
        self.assertEqual(person.get_name(), 'Alice')

    def test_set_name(self):
        person = Person('Alice', 25, 'female')
        person.set_name('Bob')
        self.assertEqual(person.get_name(), 'Bob')

    def test_get_age(self):
        person = Person('Alice', 25, 'female')
        self.assertEqual(person.get_age(), 25)

    def test_set_age(self):
        person = Person('Alice', 25, 'female')
        person.set_age(30)
        self.assertEqual(person.get_age(), 30)

    def test_get_gender(self):
        person = Person('Alice', 25, 'female')
        self.assertEqual(person.get_gender(), 'female')

    def test_set_gender(self):
        person = Person('Alice', 25, 'female')
        person.set_gender('male')
        self.assertEqual(person.get_gender(), 'male')


if __name__ == '__main__':
    unittest.main()