import HttpException from "./HttpException";

class ContentAlreadyException extends HttpException {
  constructor(title: string, type: string) {
    super(400, `${type} with title ${title} already exist!`);
  }
}

export default ContentAlreadyException;
