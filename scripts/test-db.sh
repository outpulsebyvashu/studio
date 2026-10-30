#!/usr/bin/env bash
# Runs the database tests on a throwaway local Postgres. Needs postgres 14+ binaries.
set -euo pipefail
cd "$(dirname "$0")/.."
BIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)
DATA=$(mktemp -d); PORT=${PGTEST_PORT:-5544}
if [ "$(id -u)" = 0 ]; then
  id pgtest >/dev/null 2>&1 || useradd -m pgtest
  chown -R pgtest "$DATA"; RUN="su pgtest -c"
else RUN="bash -c"; fi
$RUN "$BIN/initdb -D $DATA -A trust -U postgres >/dev/null"
$RUN "$BIN/pg_ctl -D $DATA -o '-p $PORT -k /tmp' -l $DATA/log -w start >/dev/null"
trap "$RUN \"$BIN/pg_ctl -D $DATA stop -m immediate >/dev/null\" || true; rm -rf $DATA" EXIT
P="psql -h /tmp -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
$P -c "create database t" 
P="$P -d t"
$P -f supabase/tests/00_stub_auth.sql
for f in supabase/migrations/*.sql; do $P -f "$f"; done
$P -f supabase/tests/01_rls.sql 2>&1
