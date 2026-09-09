-- Run after schema.sql in Supabase SQL Editor.
-- This migration removes self-referencing RLS policies and grants only the access required by the app.

drop policy if exists "members see membership" on public.conversation_members;
create policy "members see own membership" on public.conversation_members for select using(user_id=auth.uid());
create policy "users add themselves" on public.conversation_members for insert with check(user_id=auth.uid());

drop policy if exists "players access" on public.game_room_players;
create policy "players own access" on public.game_room_players for select using(user_id=auth.uid());
create policy "players join themselves" on public.game_room_players for insert with check(user_id=auth.uid());
create policy "players update own" on public.game_room_players for update using(user_id=auth.uid()) with check(user_id=auth.uid());

drop policy if exists "room access" on public.game_rooms;
create policy "rooms readable" on public.game_rooms for select using(host_id=auth.uid() or exists(select 1 from public.game_room_players p where p.room_id=id and p.user_id=auth.uid()));

drop policy if exists "room create" on public.game_rooms;
create policy "rooms create" on public.game_rooms for insert with check(host_id=auth.uid());
