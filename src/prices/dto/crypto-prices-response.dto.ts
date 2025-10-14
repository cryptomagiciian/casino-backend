export class CryptoPriceDto {
  symbol: string;
  name: string;
  price: string;
  change24h: number;
  icon: string;
}

export class CryptoPricesResponseDto {
  prices: CryptoPriceDto[];
}
