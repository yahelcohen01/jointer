-- Phase 1 / Slice 8 — atomic link reorder RPC.
--
-- The links table has `unique (profile_id, position) deferrable initially
-- deferred`, so we can shift positions inside a transaction without tripping
-- the constraint mid-update.
--
-- Only rows between the moved link's old and new position are touched;
-- everyone outside that range stays put.

create or replace function public.reorder_link(p_link_id uuid, p_new_position int)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_old_position int;
  v_max_position int;
begin
  if p_new_position < 0 then
    raise exception 'invalid_position';
  end if;

  select profile_id, position
    into v_profile_id, v_old_position
    from public.links
    where id = p_link_id;

  if v_profile_id is null then
    raise exception 'not_found';
  end if;

  -- RLS gate: the calling user must own the link. `auth.uid()` is null for
  -- service-role contexts, in which case we skip the check.
  if auth.uid() is not null and auth.uid() <> v_profile_id then
    raise exception 'unauthorized';
  end if;

  select coalesce(max(position), -1)
    into v_max_position
    from public.links
    where profile_id = v_profile_id;

  -- Clamp the target to the existing range.
  if p_new_position > v_max_position then
    p_new_position := v_max_position;
  end if;

  if p_new_position = v_old_position then
    return;
  end if;

  if p_new_position < v_old_position then
    -- Moving up: shift the [new, old) window down by one.
    update public.links
      set position = position + 1
      where profile_id = v_profile_id
        and position >= p_new_position
        and position < v_old_position;
  else
    -- Moving down: shift the (old, new] window up by one.
    update public.links
      set position = position - 1
      where profile_id = v_profile_id
        and position > v_old_position
        and position <= p_new_position;
  end if;

  update public.links
    set position = p_new_position
    where id = p_link_id;
end;
$$;

grant execute on function public.reorder_link(uuid, int) to authenticated;
