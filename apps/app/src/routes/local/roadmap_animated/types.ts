// Define the TokenDataPoint interface for token emission data
export interface TokenDataPoint {
  round: number;
  totalVCs: number;
  newVCs: number;
  investRound: number;
  totalInvestSum: number;
  tokenEmissionPrice: number;
  tokenPerVC: number;
  tokenEmittedInRound: number;
  totalShares: number;
  communityTokenPool: number;
  addedTokensToPool: number;
  investmentPool: number;
  /** Platform Pool value (25% of investments) - in the JSON this is called "Platform Pool (SumInvest * 0,25)" */
  platformPool: number;
  totalPoolValue: number;
  addedPoolValue: number;
  capitalIncrease: number;
  regCapitalShare: number;
  foundersDAOTreasuryShare: number;
  daoTreasuryShare: number;
  perFounderShare: number;
  minValuation: number;
  daoTreasuryFoundersValue: number;
  firstRoundEmissionValue: number;
  daoTreasuryValue: number;
  foundersShareValue: number;
  description?: string;
} 