import HttpException from "./HttpException";

class TokenAlreadyUsedException extends HttpException {
  constructor() {
    super(400, `Token already used!`);
  }
}

export default TokenAlreadyUsedException;
