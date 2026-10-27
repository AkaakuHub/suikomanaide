export type ChannelSide = -1 | 1;
export interface Channel {
  start: number;
  side: ChannelSide;
}
export interface Fork {
  start: number;
  end: number;
  rapidSide: ChannelSide;
  selected: ChannelSide | null;
}
export function forkAt(forks: Fork[], station: number) {
  return forks.find((fork) => station >= fork.start && station < fork.end);
}
export function channelOffset(fork: Fork | undefined, station: number) {
  if (!fork) return 0;
  const t = Math.max(0, Math.min(1, (station - fork.start) / 160, (fork.end - station) / 160));
  return 12 * t * t * (3 - 2 * t);
}
export function selectChannel(forks: Fork[], travel: number, x: number) {
  const fork = forkAt(forks, travel);
  if (fork && fork.selected === null) fork.selected = x < 0 ? -1 : 1;
  return fork;
}
export function channelAccessible(forks: Fork[], travel: number, channel: Channel | undefined) {
  if (!channel) return true;
  const fork = forks.find((candidate) => candidate.start === channel.start);
  return !!fork && travel >= fork.start && fork.selected === channel.side;
}
export class ForkPlan {
  readonly forks: Fork[] = [];
  private nextStart: number;
  constructor(private readonly random: () => number) {
    this.nextStart = 900 + random() * 400;
  }
  prepare(horizon: number) {
    while (this.nextStart < horizon) {
      const fork: Fork = {
        start: this.nextStart,
        end: this.nextStart + 600 + this.random() * 200,
        rapidSide: this.random() < 0.5 ? -1 : 1,
        selected: null,
      };
      this.forks.push(fork);
      this.nextStart = fork.end + 1000 + this.random() * 1000;
    }
  }
}
