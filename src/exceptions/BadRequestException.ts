import HttpException from "./HttpException";

class BadRequestException extends HttpException {
  constructor() {
    super(400, `Type should be article or project`);
  }
}

export default BadRequestException;
