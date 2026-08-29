import { PROJECTS } from './projects';

export const HOME_PROJECTS = PROJECTS.slice(0, 5);

export const HOME_AMBIENCE: Record<string, readonly [string, string, string]> = {
  'cursed-ui': ['#319a83', '#703f4c', '#956e66'],
  introverse: ['#3e8597', '#8d606d', '#b8874e'],
  whalechess: ['#4392b4', '#466b8e', '#a66d4e'],
  whoup: ['#218ba0', '#878e5a', '#d3ca70'],
  'bombay-beachy-yami-ichi': ['#28a5bb', '#ce6f5b', '#edcf52'],
  'coke-diffusion': ['#3f9bb7', '#b0362c', '#b0654f'],
  spaghettify: ['#d15f4f', '#5e7f8c', '#b3a14f'],
  swappy: ['#3a79a4', '#658ac4', '#dab968'],
  'vibe-check': ['#256eac', '#3f8ea2', '#8b5fb0'],
  'bella-coven': ['#3156a2', '#61a4c7', '#d36c6d'],
  mulabonding: ['#b26d40', '#b9a45e', '#4c6b6e'],
  pepperstake: ['#e45e7d', '#614fa8', '#2e9ba5'],
  'roadmaps-nft': ['#2b7a99', '#9a8563', '#d1b15b'],
  doomer: ['#3d5b7d', '#9d4f62', '#754f98'],
  viperbot: ['#6f7670', '#3e536c', '#b4b1a4'],
};

export function homeProjectIndex(slug: string | null | undefined): number {
  const index = HOME_PROJECTS.findIndex((project) => project.slug === slug);
  return index < 0 ? 0 : index;
}
