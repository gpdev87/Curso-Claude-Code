export type MovieSummary = {
  id: number;
  title: string;
  posterPath: string | null;
  voteAverage: number;
  releaseDate: string | null;
};

export type Provider = { id: number; name: string; logoPath: string | null };

export type CastMember = { name: string; character: string; profilePath: string | null };

export type MovieDetail = MovieSummary & {
  overview: string;
  backdropPath: string | null;
  runtime: number | null;
  genres: string[];
  certification: string | null;
  providers: Provider[];
  trailerUrl: string | null;
  cast: CastMember[];
  recommendations: MovieSummary[];
};

export type AnnotatedMovie = MovieSummary & { onMyStreamings: boolean };
