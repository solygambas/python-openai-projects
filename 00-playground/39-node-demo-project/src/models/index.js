// This file defines the data models for the application

// Example model
class User {
  constructor(id, name, email) {
    this.id = id;
    this.name = name;
    this.email = email;
  }
}

module.exports = {
  User
};