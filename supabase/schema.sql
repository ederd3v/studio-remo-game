-- ============================================================
-- STUDIO REMO GAME — banco de dados (Supabase / Postgres)
--
-- Ninguém lê nem grava as tabelas direto: o site só chama as funções abaixo.
--   · dados_publicos()            → o que o ranking, o perfil e o telão mostram (nome curto, idade, tempos)
--   · entrar(professor, pin)      → abre uma sessão de 14 h para o professor
--   · atletas_da_sessao(token)    → lista com nome completo, só para o professor
--   · cadastrar_atleta(token, …)  → novo atleta
--   · lancar_tempo(token, …)      → tempo entra validado, assinado pelo professor
--   · remover_tempo(token, id)    → desfaz um lançamento errado (fica no registro)
--   · registro(token)             → últimos lançamentos e remoções
-- PIN errado 5 vezes seguidas bloqueia aquele professor por 15 minutos.
-- Professores e PINs são cadastrados à mão (ver o fim do arquivo); o PIN fica só como hash.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.unidades (
  sigla text primary key,
  nome  text not null unique,
  ordem int  not null
);

create table if not exists public.professores (
  id            serial primary key,
  nome          text not null,
  unidade       text not null references public.unidades,
  pin_hash      text not null,
  ativo         boolean not null default true,
  falhas        int not null default 0,
  bloqueado_ate timestamptz,
  criado_em     timestamptz not null default now()
);

create table if not exists public.sessoes (
  token     uuid primary key default gen_random_uuid(),
  professor int not null references public.professores,
  expira    timestamptz not null
);

create table if not exists public.atletas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null check (char_length(btrim(nome)) between 3 and 80),
  sexo       char(1) not null check (sexo in ('M', 'F')),
  nascimento date not null,
  unidade    text not null references public.unidades,
  ativo      boolean not null default true,
  criado_por int references public.professores,
  criado_em  timestamptz not null default now()
);
-- a mesma pessoa (nome + nascimento) não vira dois cadastros
create unique index if not exists atletas_unico on public.atletas (lower(btrim(nome)), nascimento);

-- dist: 500, 1000 ou 1 (= best time)
create table if not exists public.tempos (
  id           bigserial primary key,
  atleta       uuid not null references public.atletas,
  dist         int not null check (dist in (1, 500, 1000)),
  t            numeric(6, 1) not null check (t between 20 and 900),
  data         timestamptz not null default now(),
  professor    int not null references public.professores,
  status       text not null default 'validado' check (status in ('validado', 'removido')),
  removido_por int references public.professores,
  removido_em  timestamptz
);
create index if not exists tempos_atleta on public.tempos (atleta);

alter table public.unidades    enable row level security;
alter table public.professores enable row level security;
alter table public.sessoes     enable row level security;
alter table public.atletas     enable row level security;
alter table public.tempos      enable row level security;
-- sem nenhuma policy: anon e authenticated não leem nem gravam as tabelas direto

insert into public.unidades (sigla, nome, ordem) values
  ('ITJ', 'Itajaí', 1), ('NAV', 'Navegantes', 2), ('JOI', 'Joinville', 3), ('BC', 'Balneário Camboriú', 4)
on conflict (sigla) do nothing;

-- "Lucas Boabaid" → "Lucas B." (o nome completo não sai do banco para o público)
create or replace function public.nome_publico(n text) returns text
language sql immutable set search_path = '' as $$
  select case
    when array_length(regexp_split_to_array(btrim(n), '\s+'), 1) > 1
      then split_part(btrim(n), ' ', 1) || ' ' ||
           upper(left((regexp_split_to_array(btrim(n), '\s+'))[array_length(regexp_split_to_array(btrim(n), '\s+'), 1)], 1)) || '.'
    else btrim(n)
  end
$$;

create or replace function public.idade(nasc date) returns int
language sql stable set search_path = '' as $$
  select extract(year from age(current_date, nasc))::int
$$;

-- ---------- leitura pública ----------
create or replace function public.dados_publicos() returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'atletas', coalesce((select json_agg(json_build_object(
        'id', a.id, 'n', public.nome_publico(a.nome), 's', a.sexo, 'i', public.idade(a.nascimento), 'u', a.unidade))
      from public.atletas a where a.ativo), '[]'::json),
    'tempos', coalesce((select json_agg(json_build_object(
        'id', t.id, 'a', t.atleta, 'dist', t.dist, 't', t.t, 'd', t.data, 'prof', p.nome) order by t.id)
      from public.tempos t join public.atletas a on a.id = t.atleta and a.ativo
      join public.professores p on p.id = t.professor
      where t.status = 'validado'), '[]'::json),
    'professores', coalesce((select json_agg(json_build_object('id', p.id, 'nome', p.nome, 'u', p.unidade) order by u.ordem, p.nome)
      from public.professores p join public.unidades u on u.sigla = p.unidade where p.ativo), '[]'::json)
  )
$$;

-- ---------- sessão do professor ----------
create or replace function public.entrar(p_professor int, p_pin text) returns json
language plpgsql security definer set search_path = '' as $$
declare
  p public.professores;
  tk uuid;
begin
  select * into p from public.professores where id = p_professor and ativo for update;
  if not found then raise exception 'professor' using errcode = 'P0001'; end if;
  if p.bloqueado_ate is not null and p.bloqueado_ate > now() then
    raise exception 'bloqueado:%', ceil(extract(epoch from p.bloqueado_ate - now()) / 60)::int using errcode = 'P0001';
  end if;
  if p_pin is null or extensions.crypt(p_pin, p.pin_hash) <> p.pin_hash then
    update public.professores
       set falhas = case when falhas + 1 >= 5 then 0 else falhas + 1 end,
           bloqueado_ate = case when falhas + 1 >= 5 then now() + interval '15 minutes' else bloqueado_ate end
     where id = p.id;
    return json_build_object('erro', 'pin', 'restam', greatest(0, 4 - p.falhas));
  end if;
  update public.professores set falhas = 0, bloqueado_ate = null where id = p.id;
  delete from public.sessoes where expira < now();
  insert into public.sessoes (professor, expira) values (p.id, now() + interval '14 hours') returning token into tk;
  return json_build_object('token', tk, 'id', p.id, 'nome', p.nome, 'u', p.unidade);
end
$$;

create or replace function public._professor(p_token uuid) returns int
language plpgsql stable security definer set search_path = '' as $$
declare pid int;
begin
  select s.professor into pid from public.sessoes s join public.professores p on p.id = s.professor and p.ativo
   where s.token = p_token and s.expira > now();
  if pid is null then raise exception 'sessao' using errcode = 'P0001'; end if;
  return pid;
end
$$;

create or replace function public.sair(p_token uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.sessoes where token = p_token
$$;

create or replace function public.atletas_da_sessao(p_token uuid) returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._professor(p_token);
  return coalesce((select json_agg(json_build_object(
      'id', a.id, 'nome', a.nome, 'nasc', a.nascimento, 's', a.sexo, 'u', a.unidade) order by a.nome)
    from public.atletas a where a.ativo), '[]'::json);
end
$$;

create or replace function public.cadastrar_atleta(p_token uuid, p_nome text, p_sexo text, p_nasc date, p_unidade text) returns json
language plpgsql security definer set search_path = '' as $$
declare
  pid int := public._professor(p_token);
  nome_limpo text := regexp_replace(btrim(p_nome), '\s+', ' ', 'g');
  a public.atletas;
begin
  if char_length(nome_limpo) < 3 or position(' ' in nome_limpo) = 0 then raise exception 'nome' using errcode = 'P0001'; end if;
  if p_nasc is null or p_nasc > current_date - interval '8 years' or p_nasc < date '1920-01-01' then raise exception 'nascimento' using errcode = 'P0001'; end if;
  if exists (select 1 from public.atletas where lower(nome) = lower(nome_limpo) and nascimento = p_nasc) then
    raise exception 'duplicado' using errcode = 'P0001';
  end if;
  insert into public.atletas (nome, sexo, nascimento, unidade, criado_por)
  values (nome_limpo, p_sexo, p_nasc, p_unidade, pid) returning * into a;
  return json_build_object('id', a.id, 'nome', a.nome, 'nasc', a.nascimento, 's', a.sexo, 'u', a.unidade,
    'n', public.nome_publico(a.nome), 'i', public.idade(a.nascimento));
end
$$;

create or replace function public.lancar_tempo(p_token uuid, p_atleta uuid, p_dist int, p_t numeric) returns json
language plpgsql security definer set search_path = '' as $$
declare
  pid int := public._professor(p_token);
  r public.tempos;
  limites int[] := case p_dist when 500 then array[60, 300] when 1000 then array[130, 600] when 1 then array[30, 900] end;
begin
  if limites is null then raise exception 'dist' using errcode = 'P0001'; end if;
  if p_t is null or p_t < limites[1] or p_t > limites[2] then raise exception 'tempo' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.atletas where id = p_atleta and ativo) then raise exception 'atleta' using errcode = 'P0001'; end if;
  insert into public.tempos (atleta, dist, t, professor) values (p_atleta, p_dist, round(p_t, 1), pid) returning * into r;
  return json_build_object('id', r.id, 'a', r.atleta, 'dist', r.dist, 't', r.t, 'd', r.data,
    'prof', (select nome from public.professores where id = pid));
end
$$;

create or replace function public.remover_tempo(p_token uuid, p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare pid int := public._professor(p_token);
begin
  update public.tempos set status = 'removido', removido_por = pid, removido_em = now()
   where id = p_id and status = 'validado';
  if not found then raise exception 'tempo' using errcode = 'P0001'; end if;
end
$$;

create or replace function public.registro(p_token uuid) returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._professor(p_token);
  return coalesce((select json_agg(x order by x.quando desc) from (
    select * from (
      select t.id, t.atleta as a, t.dist, t.t, t.data as quando, 'lançou' as acao, p.nome as prof, t.status
        from public.tempos t join public.professores p on p.id = t.professor
      union all
      select t.id, t.atleta, t.dist, t.t, t.removido_em, 'removeu', p.nome, t.status
        from public.tempos t join public.professores p on p.id = t.removido_por
       where t.status = 'removido'
    ) u order by quando desc limit 40
  ) x), '[]'::json);
end
$$;

-- só as funções da API ficam abertas para o site
revoke all on function public._professor(uuid) from public, anon, authenticated;
grant execute on function public.dados_publicos() to anon, authenticated;
grant execute on function public.entrar(int, text) to anon, authenticated;
grant execute on function public.sair(uuid) to anon, authenticated;
grant execute on function public.atletas_da_sessao(uuid) to anon, authenticated;
grant execute on function public.cadastrar_atleta(uuid, text, text, date, text) to anon, authenticated;
grant execute on function public.lancar_tempo(uuid, uuid, int, numeric) to anon, authenticated;
grant execute on function public.remover_tempo(uuid, bigint) to anon, authenticated;
grant execute on function public.registro(uuid) to anon, authenticated;

-- ---------- professores (à mão, fora do Git) ----------
-- insert into public.professores (nome, unidade, pin_hash)
-- values ('Prof. Fulano', 'ITJ', extensions.crypt('1234', extensions.gen_salt('bf')));
