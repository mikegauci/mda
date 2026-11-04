-- Full administrators may change their own role and permissions too. The
-- protect_last_full_admin trigger still refuses any change that would leave
-- the site without a full administrator.

create or replace function public.set_user_role(target_user uuid,new_role public.app_role) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Only full administrators can change roles' using errcode='42501'; end if;
 update public.profiles set role=new_role,admin_capabilities=null where id=target_user;
end $$;

create or replace function public.admin_save_user_profile(target_user uuid,display_name text,new_username text,new_role public.app_role,capabilities text[]) returns void language plpgsql security definer set search_path='' as $$
declare previous public.profiles;
begin
 if not private.is_admin() then raise exception 'Only full administrators can manage users' using errcode='42501'; end if;
 select * into previous from public.profiles where id=target_user for update;
 if not found then raise exception 'User not found.'; end if;
 if length(trim(display_name))>150 or length(trim(new_username))>32 then raise exception 'User details are too long.'; end if;
 update public.profiles set full_name=nullif(trim(display_name),''),username=nullif(lower(trim(new_username)),''),role=new_role,admin_capabilities=case when new_role='admin' then capabilities else null end where id=target_user;
end $$;
revoke all on function public.admin_save_user_profile(uuid,text,text,public.app_role,text[]) from public,anon;
grant execute on function public.admin_save_user_profile(uuid,text,text,public.app_role,text[]) to authenticated;
