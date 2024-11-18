import express from "express";
const router = express.Router();

// Mock database
const reservations = [];

// Route for creating a new reservation
router.post("/reservations", (req, res) => {
  const { numberOfPeople, time, date } = req.body;

  // Example raw request body:
  //   {
  //   "numberOfPeople": 4,
  //   "time": "19:00",
  //   "date": "2024-11-18"
  // }

  // Input validation
  const errors = [];

  // Validate numberOfPeople
  if (!Number.isInteger(numberOfPeople)) {
    errors.push("numberOfPeople should be an integer");
  } else if (numberOfPeople < 1 || numberOfPeople > 6) {
    errors.push("numberOfPeople should be between 1 and 6");
  }

  // Validate time
  const validTimes = [
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00",
    "22:30",
    "23:00",
  ];
  if (!validTimes.includes(time)) {
    errors.push("time should be between 5pm and 11pm, only every 30 minutes");
  }

  // Validate date
  const today = new Date();
  const reservationDate = new Date(date);
  if (isNaN(reservationDate.getTime())) {
    errors.push("date should be a valid date");
  } else if (reservationDate < today.setHours(0, 0, 0, 0)) {
    errors.push("date should be today or in the future");
  }

  // If there are validation errors, return a 400 response
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
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

export default router;
