import { PriceChart } from './PriceChart';

export function PortfolioChart(props: { points?: number[] }) {
  return <PriceChart label="Portfolio" points={props.points} />;
}

export default PortfolioChart;
