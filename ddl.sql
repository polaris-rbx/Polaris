BEGIN;
-- public.discord_server definition

CREATE TABLE IF NOT EXISTS public.discord_server (
	id varchar(20) NOT NULL,
	prefix varchar(2) NULL,
	auto_verify bool NOT NULL DEFAULT false,
	dm_welcome bool NOT NULL DEFAULT true,
	welcome_message varchar(500) NULL,
	verified_role varchar(20) NULL,
	unverified_role varchar(20) NULL,
	log_channel varchar(20) NULL,
	announce_channel varchar(20) NULL,
	CONSTRAINT server_pk PRIMARY KEY (id),
	CONSTRAINT verified_roles_unique UNIQUE (verified_role, unverified_role)
);


-- public.roblox_group definition

CREATE TABLE IF NOT EXISTS public.roblox_group (
	id int4 NOT NULL DEFAULT nextval('group_id_seq'::regclass),
	server_id varchar(20) NOT NULL,
	watch_shout bool NOT NULL DEFAULT false,
	"primary" bool NOT NULL DEFAULT false,
	roblox_id int4 NOT NULL,
	CONSTRAINT group_pk PRIMARY KEY (id)
);


-- public.roblox_group foreign keys
ALTER TABLE public.roblox_group ADD CONSTRAINT group_fk FOREIGN KEY (server_id) REFERENCES discord_server(id) ON DELETE CASCADE;


-- public.discord_role definition

CREATE TABLE IF NOT EXISTS public.discord_role (
	id varchar(20) NOT NULL,
	nickname_exempt bool NOT NULL DEFAULT false,
	server_id varchar(20) NOT NULL,
	moderator bool NOT NULL DEFAULT false,
	CONSTRAINT role_binding_pk PRIMARY KEY (id)
);


-- public.discord_role foreign keys
ALTER TABLE public.discord_role ADD CONSTRAINT role_binding_fk FOREIGN KEY (server_id) REFERENCES discord_server(id) ON DELETE CASCADE;


-- public.group_bind definition

CREATE TABLE IF NOT EXISTS public.group_bind (
	id int4 NOT NULL, -- The Roblox roleset id
	binding_id varchar(20) NOT NULL, -- id of the role in role_binding
	group_id int4 NOT NULL,
	short_name varchar(10) NULL, -- Shortened name used in nickanme templates
	CONSTRAINT group_bind_pk PRIMARY KEY (id, binding_id)
);

-- Column comments
COMMENT ON COLUMN public.group_bind.id IS 'The Roblox roleset id';
COMMENT ON COLUMN public.group_bind.binding_id IS 'id of the role in role_binding';
COMMENT ON COLUMN public.group_bind.short_name IS 'Shortened name used in nickanme templates';

-- public.group_bind foreign keys
ALTER TABLE public.group_bind ADD CONSTRAINT group_bind_fk FOREIGN KEY (group_id) REFERENCES roblox_group(id) ON DELETE CASCADE;
ALTER TABLE public.group_bind ADD CONSTRAINT group_bind_fk_1 FOREIGN KEY (binding_id) REFERENCES discord_role(id) ON DELETE CASCADE;


-- public.asset_bind definition

CREATE TABLE IF NOT EXISTS public.asset_bind (
	id int4 NOT NULL,
	binding_id varchar(20) NOT NULL,
	asset_type int4 NOT NULL,
	CONSTRAINT asset_bind_pk PRIMARY KEY (id, binding_id)
);

-- public.asset_bind foreign keys
ALTER TABLE public.asset_bind ADD CONSTRAINT asset_bind_fk FOREIGN KEY (binding_id) REFERENCES discord_role(id) ON DELETE CASCADE;

COMMIT;
