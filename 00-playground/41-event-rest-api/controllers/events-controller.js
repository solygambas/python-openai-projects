import {
  create,
  findByIdAndUpdate,
  findByIdAndDelete,
  find,
  findById,
  validate,
  register,
  unregister,
} from "../models/event.js";

export const createEvent = async (req, res) => {
  try {
    const { title, description, address, date } = req.body;
    const image = req.file;

    const eventData = {
      title,
      description,
      address,
      date,
      image: image.filename,
      userId: req.user.userId,
    };

    // Validate event data
    const isValid = validate(eventData);
    if (!isValid || !image) {
      return res.status(400).json({
        message: "Invalid event data. Title, date and image are required.",
      });
    }

    const event = await create(eventData);
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const editEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, address, date } = req.body;
    const image = req.file;
    const eventData = {
      title,
      description,
      address,
      date,
      image: image.filename,
    };

    // Validate event data
    const isValid = validate(eventData);
    if (!isValid || !image) {
      return res.status(400).json({
        message: "Invalid event data. Title, date and image are required.",
      });
    }

    const updatedEvent = await findByIdAndUpdate(id, eventData);
    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    // Check if the user owns the event
    const existingEvent = await findById(id);
    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (existingEvent.user_id !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this event" });
    }
    res.status(200).json(updatedEvent);
  } catch (error) {
    // Use 400 for validation errors
    res.status(400).json({ message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if the user owns the event
    const deletedEvent = await findByIdAndDelete(id);
    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (deletedEvent.user_id !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this event" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const events = await find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const registerToEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    const registration = await register(req.user.userId, id);
    res.status(200).json({ message: "Registered to event", registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unregisterFromEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    const result = await unregister(req.user.userId, id);
    if (!result) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.status(200).json({ message: "Unregistered from event" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
