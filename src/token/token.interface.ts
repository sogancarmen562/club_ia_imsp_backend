interface TokenData {
  token: string;
  expiresIn: number;
}

export interface ITokenRepository {
  store(token: string): Promise<void>;
  getStatus(token: string): Promise<boolean>;
  toggleStatus(token: string): Promise<void>;
}

export default TokenData;
