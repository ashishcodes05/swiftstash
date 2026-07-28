import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const formatTimeAgo = (mongoDate) => {
  if (!mongoDate) return "Unknown date";
  return dayjs(mongoDate).fromNow();
};

export const formatExactDate = (mongoDate) => {
  if (!mongoDate) return "Unknown date";
  return dayjs(mongoDate).format("MMM D, YYYY");
};