import { PROJECTS } from './projects.js';

export const HOME_PROJECTS = PROJECTS.slice(0, 5);

export const HOME_AMBIENCE = {
  introverse: ['#3e8597', '#8d606d', '#b8874e'],
  whalechess: ['#4392b4', '#466b8e', '#a66d4e'],
  whoup: ['#218ba0', '#878e5a', '#d3ca70'],
  'bombay-beachy-yami-ichi': ['#28a5bb', '#ce6f5b', '#edcf52'],
  'coke-diffusion': ['#3f9bb7', '#b0362c', '#b0654f'],
};

export function homeProjectIndex(slug) {
  const index = HOME_PROJECTS.findIndex((project) => project.slug === slug);
  return index < 0 ? 0 : index;
}
