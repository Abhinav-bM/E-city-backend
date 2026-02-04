export const sendResponse = (
  res,
  statusCode,
  success,
  message,
  data = null,
) => {
  const response = {
    status_code: statusCode,
    success,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode, message, error = null) => {
  const response = {
    status_code: statusCode,
    success: false,
    message,
    error: error ? error.message || error : null,
  };
  return res.status(statusCode).json(response);
};
