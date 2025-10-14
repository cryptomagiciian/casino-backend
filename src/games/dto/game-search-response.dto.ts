export class GameSearchResultDto {
  slug: string;
  name: string;
  type: string;
  description: string;
  minBet: string;
  maxBet: string;
}

export class GameSearchResponseDto {
  results: GameSearchResultDto[];
}
