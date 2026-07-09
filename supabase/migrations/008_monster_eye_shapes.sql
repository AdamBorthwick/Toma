-- Eye shape variants for monster customization.

alter table monsters add column if not exists eye_shape_key text not null default 'round';
