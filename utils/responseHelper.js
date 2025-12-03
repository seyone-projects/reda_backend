export const sendError = (res, message = "Something went wrong", statusCode = 400, data = null) => {
  return res.status(statusCode).json({
    status: false,
    message,
    data,
  });
};

export const sendSuccess = (res, message = "Success", statusCode = 200, data = null) => {
  return res.status(statusCode).json({
    status: true,
    message,
    data,
  });
};
