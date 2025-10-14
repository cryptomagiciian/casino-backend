export class LiveWinDto {
  id: string;
  username: string;
  game: string;
  gameSlug: string;
  amount: string;
  multiplier: number;
  payout: string;
  currency: string;
  timestamp: string;
}

export class LiveWinsResponseDto {
  wins: LiveWinDto[];
}
