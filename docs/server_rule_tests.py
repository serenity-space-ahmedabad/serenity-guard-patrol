import json, psycopg2, sys

conn = psycopg2.connect(host="/tmp", port=5499, user="postgres", dbname="t")
conn.autocommit = True
cur = conn.cursor()

ADMIN = "00000000-0000-0000-0000-00000000000a"
G1 = "00000000-0000-0000-0000-000000000001"
G2 = "00000000-0000-0000-0000-000000000002"
results = []

def owner(sql, *a):
    cur.execute("reset role; select set_config('request.jwt.claim.sub','',false)")
    cur.execute(sql, a)
    return cur.fetchall() if cur.description else None

def as_user(uid, sql, *a):
    cur.execute("set role authenticated; select set_config('request.jwt.claim.sub', %s, false)", (uid,))
    try:
        cur.execute(sql, a)
        return cur.fetchall() if cur.description else None
    finally:
        cur.execute("reset role")

def check(name, cond, info=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + ("  -> " + str(info) if info else ""))

# ---------- setup ----------
owner("update app_settings set value='admin@test.local' where key='super_admin_email'")
owner("update app_settings set value='photo' where key='media_mode'")
owner("insert into auth.users(id,email) values (%s,'admin@test.local'),(%s,'g01@x'),(%s,'g02@x')", ADMIN, G1, G2)
check("super admin auto-created", owner("select count(*) from admins where user_id=%s", ADMIN)[0][0] == 1)

owner("insert into guards(id,code,name) values (%s,'G01','Ramesh'),(%s,'G02','Suresh')", G1, G2)
# three checkpoints ~ 80-100 m apart around a society campus
cps = owner("""insert into checkpoints(name,area,lat,lng,radius_m) values
  ('Main Gate','Entrance',23.10000,72.53000,25),
  ('E Block Lift Lobby','E Block',23.10080,72.53000,25),
  ('Back Gate','Rear',23.10080,72.53090,25) returning id, qr_token, name""")
CP = {n: (i, t) for i, t, n in cps}
rid = owner("insert into routes(name) values ('Night round') returning id")[0][0]
for seq, n in enumerate(['Main Gate', 'E Block Lift Lobby', 'Back Gate'], 1):
    owner("insert into route_checkpoints values (%s,%s,%s)", rid, CP[n][0], seq)
# schedule that started 5 minutes ago (local time), 45 min window
owner("""insert into schedules(route_id,start_time,window_minutes)
         values (%s, ((now() at time zone 'Asia/Kolkata') - interval '5 minutes')::time, 45)""", rid)

# ---------- guard opens app ----------
home = as_user(G1, "select guard_home('PHONE-1')")[0][0]
check("guard_home returns server time + open round", home['rounds'] and home['rounds'][0]['open_now'], home['server_now'])
check("device locked to first phone", owner("select device_id from guards where id=%s", G1)[0][0] == 'PHONE-1')
ROUND = home['rounds'][0]['id']

def scan(uid, qr, lat, lng, acc=8, device='PHONE-1', upload=True, frames=5, tamper=None):
    ch = as_user(uid, "select start_scan(%s)", ROUND)[0][0]
    path = f"{uid}/{ch['challenge_id']}.jpg"
    if upload:
        as_user(uid, "insert into storage.objects(bucket_id,name) values ('patrol-media',%s)", path)
    if tamper:
        owner(tamper, ch['challenge_id'])
    return ch, as_user(uid, "select submit_scan(%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                       ch['challenge_id'], qr, lat, lng, acc, device, path, frames, 'test-agent')[0][0]

def backdate_scans(minutes):
    owner("update scans set scanned_at = scanned_at - make_interval(mins => %s)", minutes)

# 1. Genuine scan at main gate
ch, r = scan(G1, 'SSP1:' + CP['Main Gate'][1], 23.10002, 72.53001)
check("1 genuine scan accepted", r['status'] == 'ok' and r['flags'] == [], r)
check("  challenge code is 4 digits", len(ch['code']) == 4, ch['code'])

# 2. Same session reused
try:
    as_user(G1, "select submit_scan(%s,%s,null,null,null,'PHONE-1','x',1,'x')", ch['challenge_id'], 'SSP1:' + CP['Main Gate'][1])
    check("2 reused session blocked", False)
except Exception as e:
    check("2 reused session blocked", 'already used' in str(e), str(e).split('\n')[0])

# 3. Next checkpoint only seconds later -> too fast
ch, r = scan(G1, 'SSP1:' + CP['E Block Lift Lobby'][1], 23.10081, 72.53000)
check("3 scan 80 m away within seconds flagged TOO_FAST", r['status'] == 'review' and 'TOO_FAST' in r['flags'], r['flags'])
owner("delete from scans where flags @> '{TOO_FAST}'")

# 4. Proper timing (prev scan 2 min ago) -> ok
backdate_scans(2)
ch, r = scan(G1, 'SSP1:' + CP['E Block Lift Lobby'][1], 23.10081, 72.53000)
check("4 next checkpoint after 2 min accepted", r['status'] == 'ok', r)

# 5. Duplicate checkpoint
backdate_scans(2)
ch, r = scan(G1, 'SSP1:' + CP['E Block Lift Lobby'][1], 23.10081, 72.53000)
check("5 duplicate rejected", r['status'] == 'rejected' and 'DUPLICATE' in r['flags'], r['message'])

# 6. QR photo scanned from the guard room (300 m away)
ch, r = scan(G1, 'SSP1:' + CP['Back Gate'][1], 23.1035, 72.5300)
check("6 scanned far away flagged OUT_OF_ZONE", r['status'] == 'review' and 'OUT_OF_ZONE' in r['flags'], r['flags'])
owner("delete from scans where flags @> '{OUT_OF_ZONE}'")

# 7. Committee re-keys Back Gate; guard uses old photographed copy
OLD = CP['Back Gate'][1]
as_user(ADMIN, "select admin_rekey_checkpoint(%s)", CP['Back Gate'][0])
ch, r = scan(G1, 'SSP1:' + OLD, 23.10080, 72.53090)
check("7 old (photographed) QR rejected as OLD_QR", r['status'] == 'rejected' and 'OLD_QR' in r['flags'], r['message'])

# 8. Random / fake QR
ch, r = scan(G1, 'hello-world', 23.10080, 72.53090)
check("8 foreign QR rejected", r['status'] == 'rejected' and 'UNKNOWN_QR' in r['flags'], r['flags'])

# 9. No photo uploaded
NEW = owner("select qr_token from checkpoints where id=%s", CP['Back Gate'][0])[0][0]
ch, r = scan(G1, 'SSP1:' + NEW, 23.10080, 72.53090, upload=False)
check("9 missing photo/video rejected", r['status'] == 'rejected' and 'NO_MEDIA' in r['flags'], r['flags'])

# 10. Session expired (server time)
ch, r = scan(G1, 'SSP1:' + NEW, 23.10080, 72.53090, tamper="update challenges set expires_at = now() - interval '1 second', issued_at = now() - interval '5 minutes' where id=%s")
check("10 expired session rejected", r['status'] == 'rejected' and 'EXPIRED' in r['flags'], r['flags'])

# 11. Media path belonging to a different session is not accepted
ch1 = as_user(G1, "select start_scan(%s)", ROUND)[0][0]
other = f"{G1}/{ch1['challenge_id']}.jpg"
as_user(G1, "insert into storage.objects(bucket_id,name) values ('patrol-media',%s)", other)
ch2 = as_user(G1, "select start_scan(%s)", ROUND)[0][0]
r = as_user(G1, "select submit_scan(%s,%s,%s,%s,8,'PHONE-1',%s,5,'t')", ch2['challenge_id'], 'SSP1:' + NEW, 23.1008, 72.5309, other)[0][0]
check("11 re-using an older photo rejected", r['status'] == 'rejected' and 'NO_MEDIA' in r['flags'], r['flags'])

# 12. Guard cannot upload into another guard's folder
try:
    as_user(G1, "insert into storage.objects(bucket_id,name) values ('patrol-media',%s)", f"{G2}/x.jpg")
    check("12 upload into other guard's folder blocked", False)
except Exception as e:
    check("12 upload into other guard's folder blocked", 'row-level security' in str(e))

# 13. Logged in on a different phone, last checkpoint
backdate_scans(3)
ch, r = scan(G1, 'SSP1:' + NEW, 23.10080, 72.53090, device='PHONE-X')
check("13 different phone flagged OTHER_PHONE", r['status'] == 'review' and 'OTHER_PHONE' in r['flags'], r)
check("   round shows 3/3 done", r['done'] == 3 and r['total'] == 3)

# 14. Guards cannot read QR tokens or scans directly
rows = as_user(G1, "select count(*) from checkpoints")[0][0]
rows2 = as_user(G1, "select count(*) from scans")[0][0]
check("14 guard sees no checkpoint tokens / scans via tables", rows == 0 and rows2 == 0)

# 15. Scan time is server time
st = owner("select bool_and(abs(extract(epoch from scanned_at - now())) < 3600) from scans")[0][0]
check("15 scanned_at set by server clock", st)

# 16. Admin view
rs = as_user(ADMIN, "select status, done, total, flagged, rejected from round_status where id=%s", ROUND)[0]
check("16 admin round_status completed", rs[0] == 'completed', rs)

# 17. Admin rejects flagged scan -> round becomes in_progress (2/3)
sid = owner("select id from scans where flags @> '{OTHER_PHONE}'")[0][0]
as_user(ADMIN, "select admin_review_scan(%s,'rejected','Different phone used')", sid)
rs = as_user(ADMIN, "select status, done from round_status where id=%s", ROUND)[0]
check("17 rejecting a scan reopens the round", rs == ('in_progress', 2), rs)

# 18. Guard cannot call admin functions
try:
    as_user(G1, "select admin_rekey_checkpoint(%s)", CP['Main Gate'][0]); check("18 guard blocked from admin", False)
except Exception as e:
    check("18 guard blocked from admin functions", 'Admins only' in str(e))

# 19. Missed round detection: a round whose window ended with no scans
owner("""insert into schedules(route_id,start_time,window_minutes)
         values (%s, ((now() at time zone 'Asia/Kolkata') - interval '3 hours')::time, 30)""", rid)
as_user(G1, "select guard_home('PHONE-1')")
st = as_user(ADMIN, """select status from round_status where due_end < now()
                       and round_date = (now() at time zone 'Asia/Kolkata')::date""")
check("19 earlier unpatrolled round marked missed", st and st[0][0] == 'missed', st)

# 20. Random media mode yields both photo and video
owner("update app_settings set value='random' where key='media_mode'")
types = {as_user(G1, "select start_scan(%s)", ROUND)[0][0]['media_type'] for _ in range(40)}
check("20 random mode mixes photo and video", types == {'photo', 'video'}, types)

print(f"\n{sum(ok for _, ok in results)}/{len(results)} passed")
sys.exit(0 if all(ok for _, ok in results) else 1)
