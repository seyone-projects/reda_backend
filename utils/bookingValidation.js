import {
  AMENITY_TYPE_HALF_DAY,
  AMENITY_TYPE_HOURLY,
  AMENITY_TYPE_WHOLE_DAY,
  TIME_SLOT_MORNING,
  TIME_SLOT_AFTERNOON,
  AMENITY_TYPE_FREE,
} from "../constants/AmenityStatus.js";
import { isFreeBookingExists } from "../controllers/amenityBookingController.js";
import Booking from "../models/amenityBookingModel.js";
import Amenity from "../models/amenityModel.js";

const isTimeInRange = (time, range) => {
  const timeToCheck = new Date(0, 0, 0, time.getHours(), time.getMinutes());
  return timeToCheck >= range.start && timeToCheck <= range.end;
};

const createTimeRange = (startHour, startMinute, endHour, endMinute) => {
  return {
    start: new Date(0, 0, 0, startHour, startMinute),
    end: new Date(0, 0, 0, endHour, endMinute),
  };
};

const morningRange = createTimeRange(6, 0, 12, 0);
const afternoonRange = createTimeRange(12, 0, 18, 0);

const isWholeDayBooking = async (amenityId, bookingStartDate, associationId) => {

  const startOfDay = new Date(bookingStartDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(bookingStartDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingHalfDayBooking = await Booking.findOne({
    associationId,
    isCancelled: false,
    amenityId,
    bookingStartDate: { $gte: startOfDay, $lte: endOfDay },
    $or: [
      { timeSlot: "Morning", startTime: { $ne: "" } },
      { timeSlot: "Afternoon", startTime: { $ne: "" } },
    ],
  });

  if (existingHalfDayBooking) {
    return {
      error:
        "Whole day booking is not allowed as there is already a half-day booking for this date.",
    };
  }

  return null; // No conflicting half-day booking exists
};

const isBookingExists = async (amenityId, bookingStartDate, associationId) => {
  const startOfDay = new Date(bookingStartDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(bookingStartDate);
  endOfDay.setHours(23, 59, 59, 999);

  return await Booking.findOne({
    associationId,
    isCancelled: false,
    amenityId,
    amenityType: AMENITY_TYPE_WHOLE_DAY,
    bookingStartDate: { $gte: startOfDay, $lte: endOfDay },
  });
};

const isHourlyBookingExists = async (
  amenityId,
  bookingStartDate,
  startTime,
  endTime,
  associationId
) => {
  const startOfDay = new Date(bookingStartDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(bookingStartDate);
  endOfDay.setHours(23, 59, 59, 999);

  const bookingStartDateTime = new Date(`${bookingStartDate}T${startTime}:00`);
  const bookingEndDateTime = new Date(`${bookingStartDate}T${endTime}:00`);

  // 1. Check for direct overlap
  const overlapBooking = await Booking.findOne({
    associationId,
    isCancelled: false,
    amenityId,
    bookingStartDate: { $gte: startOfDay, $lte: endOfDay },
    startTime: { $ne: "" },
    endTime: { $ne: "" },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      },
    ],
  });

  if (overlapBooking) {
    return {
      type: "booked",
      booking: overlapBooking,
    };
  }

  // 2. Check for maintenance buffer
  const lastBooking = await Booking.findOne({
    associationId,
    isCancelled: false,
    amenityId,
    bookingStartDate: { $gte: startOfDay, $lte: endOfDay },
    startTime: { $ne: "" },
    endTime: { $ne: "" },
  }).sort({ endTime: -1 }); // Get latest ending booking

  if (lastBooking) {
    const lastEnd = new Date(`${bookingStartDate}T${lastBooking.endTime}:00`);
    const maintenanceEnd = new Date(lastEnd.getTime() + 30 * 60000); // +30 min

    if (
      bookingStartDateTime < maintenanceEnd &&
      bookingStartDateTime >= lastEnd
    ) {
      return {
        type: "maintenance",
        maintenanceUntil: maintenanceEnd.toTimeString().slice(0, 5),
      };
    }
  }

  return null;
};

const isOverlappingHourlyBooking = async (
  amenityId,
  bookingStartDate,
  startTime,
  endTime,
  associationId
) => {

  // Convert the provided start and end times to Date objects
  const startDateTime = new Date(`${bookingStartDate}T${startTime}:00`);
  const endDateTime = new Date(`${bookingStartDate}T${endTime}:00`);

  const overlappingBooking = await Booking.findOne({
    associationId,
    isCancelled: false,
    amenityId: amenityId,
    bookingStartDate: bookingStartDate,
    amenityType: "Hourly",
    $or: [
      // Condition 1: Existing booking starts before the new booking ends AND ends after the new booking starts
      {
        startTime: { $lt: endDateTime },
        endTime: { $gt: startDateTime },
      },
      // Condition 2: New booking starts during an existing booking time range
      {
        startTime: { $gte: startDateTime, $lt: endDateTime },
      },
      // Condition 3: New booking ends during an existing booking time range
      {
        endTime: { $gt: startDateTime, $lte: endDateTime },
      },
    ],
  });

  return overlappingBooking !== null;
};

const isConflictingHalfDayBooking = async (
  amenityId,
  bookingStartDate,
  startTime,
  endTime,
  associationId
) => {
  const morningExists = await Booking.findOne({
    associationId,
    isCancelled: false,
    amenityId,
    bookingStartDate,
    timeSlot: TIME_SLOT_MORNING,
  });

  const afternoonExists = await Booking.findOne({
    associationId,
    isCancelled: false,
    amenityId,
    bookingStartDate,
    timeSlot: TIME_SLOT_AFTERNOON,
  });

  if (
    morningExists &&
    isTimeInRange(
      new Date(0, 0, 0, startTime.split(":")[0], startTime.split(":")[1]),
      morningRange
    )
  ) {
    return true;
  }
  if (
    afternoonExists &&
    isTimeInRange(
      new Date(0, 0, 0, startTime.split(":")[0], startTime.split(":")[1]),
      afternoonRange
    )
  ) {
    return true;
  }
  return false;
};

async function validateAmenityBooking({
  amenityId,
  bookingStartDate,
  startTime,
  endTime,
  timeSlot,
  amenity,
  associationId,
}) {

  if (!amenityId || !bookingStartDate || !amenity) {
    return { status: false, message: "Missing required fields" };
  }

  const date = new Date(bookingStartDate);

  if (amenity === AMENITY_TYPE_WHOLE_DAY) {
    const bookingExists = await isWholeDayBooking(amenityId, date, associationId);
    if (bookingExists) {
      return {
        status: false,
        message: "Booking already exists for this whole day",
      };
    }
  }

  if (amenity === AMENITY_TYPE_FREE) {
    const exists = await isFreeBookingExists(amenityId, bookingStartDate, associationId);
    if (exists)
      return { status: false, message: "Booking already exists for this day" };
  }

  if (amenity === AMENITY_TYPE_HALF_DAY) {
    const bookingExists = await isBookingExists(amenityId, date, associationId);
    if (bookingExists) {
      return { status: false, message: "Booking already exists for this day" };
    }

    if (timeSlot) {
      const slotExists = await Booking.findOne({
        associationId,
        isCancelled: false,
        amenityId,
        bookingStartDate: date,
        timeSlot,
      });
      if (slotExists) {
        return {
          status: false,
          message: "Booking already exists for this slot",
        };
      }
    }
  }

  if (amenity === AMENITY_TYPE_HOURLY) {
    if (!startTime || !endTime) {
      return {
        status: false,
        message: "Start time and end time are required for hourly booking",
      };
    }

    const fullDayExists = await isHourlyBookingExists(
      amenityId,
      date,
      startTime,
      endTime,
      associationId
    );

    if (fullDayExists) {
      if (fullDayExists.type === "booked") {
        return {
          status: false,
          message: "Slot already booked.",
        };
      }

      if (fullDayExists.type === "maintenance") {
        return {
          status: false,
          message: `Under maintenance until ${fullDayExists.maintenanceUntil}.`,
        };
      }
    }

    const conflictingHalfDay = await isConflictingHalfDayBooking(
      amenityId,
      date,
      startTime,
      endTime,
      associationId
    );
    if (conflictingHalfDay) {
      return {
        status: false,
        message: "Conflicting half-day booking exists for this time slot",
      };
    }

    const overlappingBooking = await isOverlappingHourlyBooking(
      amenityId,
      date,
      startTime,
      endTime,
      associationId
    );
    if (overlappingBooking) {
      return {
        status: false,
        message: "Overlapping hourly booking exists for this time slot",
      };
    }
  }

  return { status: true, validation: true };
}

export {
  isWholeDayBooking,
  isBookingExists,
  isHourlyBookingExists,
  isOverlappingHourlyBooking,
  isConflictingHalfDayBooking,
  validateAmenityBooking,
};
