import HttpException from "./HttpException";

class TokenNotFoundException extends HttpException {
  constructor() {
    super(404, `Token not found`);
  }
}

export default TokenNotFoundException;
