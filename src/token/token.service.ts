import { ITokenRepository } from "./token.interface";

class TokenService {
  constructor(private readonly repository: ITokenRepository) {}

  async store(token: string): Promise<void> {
    await this.repository.store(token);
  }

  async getStatus(token: string): Promise<boolean> {
    return this.repository.getStatus(token);
  }

  async toggleStatus(token: string): Promise<void> {
    await this.repository.toggleStatus(token);
  }
}

export default TokenService;
