CREATE TABLE public.content (
	id serial NOT NULL,
	title varchar NOT NULL,
	contain text NOT NULL,
	created_at date NOT NULL,
	updated_at date NOT NULL,
	type varchar NOT NULL,
	medias jsonb,
	comming_soon_at date,
	CONSTRAINT articles_pk PRIMARY KEY (id)
);

CREATE TABLE public.subscriber (
	id serial NOT NULL,
	email varchar NOT NULL,
	joined_at date NOT NULL,
	password varchar,
	role varchar NOT NULL,
	state varchar,
	CONSTRAINT subscriber_pk PRIMARY KEY (id)
);

CREATE TABLE public.token(
	id serial NOT NULL,
	value varchar(255) NOT NULL,
	is_used boolean NOT NULL DEFAULT false,
	CONSTRAINT token_pk PRIMARY KEY(id)
);