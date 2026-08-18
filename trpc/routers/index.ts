import { createTRPCRouter } from '../init'
import { genresRouter } from './genres/genres.router'
import { healthRouter } from './health/health.router'
import { moviesRouter } from './movies/movies.router'
import { peopleRouter } from './people/people.router'

export const appRouter = createTRPCRouter({
  health: healthRouter,
  movies: moviesRouter,
  people: peopleRouter,
  genres: genresRouter,
})

export type AppRouter = typeof appRouter
