class ApiResponse {
  constructor(data = null, message = "", statusCode = 200) {
    this.message = message;
    this.status = true;
    this.data = data;
    this.statusCode = statusCode;
  }
}

export default ApiResponse
