import { PriceChart } from './PriceChart';

export function VolumeChart(props: { points?: number[] }) {
  return <PriceChart label="Volume" points={props.points ?? [20, 35, 28, 50, 42, 60, 55]} />;
}

export default VolumeChart;
