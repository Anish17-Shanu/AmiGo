import { Activity } from "../models/Activity.js";
import { SOCKET_EVENTS } from "../utils/socketEvents.js";

let ioRef = null;

export const setSocketServer = (io) => {
  ioRef = io;
};

export const emitEvent = (event, payload) => {
  if (ioRef) ioRef.emit(event, payload);
};

export const trackActivity = async ({ user, type, metadata = {} }) => {
  const activity = await Activity.create({ user, type, metadata });
  emitEvent(SOCKET_EVENTS.USER_ACTIVITY, activity);
  return activity;
};
