class ApiResponse {
  constructor(data = null, message = "", error = null, statusCode = 200) {
    this.message = message;
    this.status = true;
    this.data = data;
    this.error = error;
    this.statusCode = statusCode;
  }
}

export default ApiResponse;
