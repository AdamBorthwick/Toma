-- Display names ("made by …") don't need to be globally unique.

alter table users drop constraint if exists users_username_key;
