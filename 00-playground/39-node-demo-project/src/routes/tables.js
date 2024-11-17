const express = require("express");
const router = express.Router();

// Mock database
const reservations = [];

// Route for creating a new reservation
router.post("/reservations", (req, res) => {
  const { numberOfPeople, time, date } = req.body;
  const newReservation = {
    id: reservations.length + 1,
    numberOfPeople,
    time,
    date,
  };
  reservations.push(newReservation);
  res.status(201).json(newReservation);
});

// Route for deleting an existing reservation
router.delete("/reservations/:id", (req, res) => {
  const { id } = req.params;
  const reservationIndex = reservations.findIndex((r) => r.id === parseInt(id));
  if (reservationIndex !== -1) {
    const deletedReservation = reservations.splice(reservationIndex, 1);
    res.status(200).json(deletedReservation);
  } else {
    res.status(404).json({ message: "Reservation not found" });
  }
});

module.exports = router;
