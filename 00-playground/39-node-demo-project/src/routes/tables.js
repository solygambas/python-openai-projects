import express from "express";
const router = express.Router();

// Mock database
const reservations = [];

// Validation functions
const validateNumberOfPeople = (numberOfPeople, maxPeople = 6) => {
  if (!Number.isInteger(numberOfPeople)) {
    return "numberOfPeople should be an integer";
  } else if (numberOfPeople < 1 || numberOfPeople > maxPeople) {
    return `numberOfPeople should be between 1 and ${maxPeople}`;
  }
  return null;
};

const validateTime = (time) => {
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
    return "time should be between 5pm and 11pm, only every 30 minutes";
  }
  return null;
};

const validateDate = (date) => {
  const today = new Date();
  const reservationDate = new Date(date);
  if (isNaN(reservationDate.getTime())) {
    return "date should be a valid date";
  } else if (reservationDate < today.setHours(0, 0, 0, 0)) {
    return "date should be today or in the future";
  }
  return null;
};

const validateReservationData = (data, isUpdate = false) => {
  const errors = [];
  const { numberOfPeople, time, date } = data;

  if (!isUpdate || numberOfPeople !== undefined) {
    const numberError = validateNumberOfPeople(
      numberOfPeople,
      isUpdate ? 10 : 6
    );
    if (numberError) errors.push(numberError);
  }

  if (!isUpdate || time !== undefined) {
    const timeError = validateTime(time);
    if (timeError) errors.push(timeError);
  }

  if (!isUpdate || date !== undefined) {
    const dateError = validateDate(date);
    if (dateError) errors.push(dateError);
  }

  return errors;
};

// Route for creating a new reservation
router.post("/reservations", (req, res) => {
  const { numberOfPeople, time, date } = req.body;

  // Example raw request body:
  //   {
  //   "numberOfPeople": 4,
  //   "time": "19:00",
  //   "date": "2024-11-18"
  // }

  const errors = validateReservationData({ numberOfPeople, time, date });

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

// Route for updating an existing reservation
router.put("/reservations/:id", (req, res) => {
  const { id } = req.params;
  const { numberOfPeople, time, date } = req.body;
  const reservationIndex = reservations.findIndex((r) => r.id === parseInt(id));

  if (reservationIndex === -1) {
    return res.status(404).json({ message: "Reservation not found" });
  }

  const errors = validateReservationData({ numberOfPeople, time, date }, true);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // Update only the provided fields
  const updatedReservation = {
    ...reservations[reservationIndex],
    ...(numberOfPeople !== undefined && { numberOfPeople }),
    ...(time !== undefined && { time }),
    ...(date !== undefined && { date }),
  };

  reservations[reservationIndex] = updatedReservation;
  res.status(200).json(updatedReservation);
});

export default router;
