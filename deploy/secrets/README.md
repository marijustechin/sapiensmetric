# SapiensMetric closed-review secrets (T-023)

Root-managed files consumed by the API via `*_FILE` variables. **No secret value
is ever committed, printed, or pasted into chat.** The directory itself is
`root:root 0700`; files are owned by the API runtime UID `10001:10001` and mode
`0400` where the container reads them as UID 10001.

| File | Consumed as | Purpose |
|---|---|---|
| `mysql_root_password` | `MYSQL_ROOT_PASSWORD_FILE` (db) | MySQL bootstrap superuser |
| `mysql_password` | `MYSQL_PASSWORD_FILE` (api, db, tools) | application DB login |
| `jwt_secret` | `JWT_SECRET_FILE` (api) | signs access tokens |
| `smtp_password` | `SMTP_PASSWORD_FILE` (api) | authorised transactional SMTP login |

## Provisioning (root, on the host)

Generate values with secure tooling — do not invent them by hand:

```sh
sudo install -d -m 0700 -o root -g root /etc/sapiensmetric/secrets
gen() { openssl rand -base64 36 | tr -d '\n'; }   # ~48 chars, url-safe enough

# Generate once, write directly to the root-only file (never echoed to a log):
umask 077
sudo sh -c 'openssl rand -base64 36 | tr -d "\n" > /etc/sapiensmetric/secrets/mysql_root_password'
sudo sh -c 'openssl rand -base64 36 | tr -d "\n" > /etc/sapiensmetric/secrets/mysql_password'
sudo sh -c 'openssl rand -base64 36 | tr -d "\n" > /etc/sapiensmetric/secrets/jwt_secret'
# smtp_password: copy the EXISTING authorised SapiensMetric SMTP password into
# the file without printing it (see docs/closed-review-deployment.md).

sudo chown 10001:10001 /etc/sapiensmetric/secrets/{mysql_password,jwt_secret,smtp_password}
sudo chown 0:0 /etc/sapiensmetric/secrets/mysql_root_password
sudo chmod 0400 /etc/sapiensmetric/secrets/*
```

Rotate by regenerating the file and recreating the affected containers
(`docker compose up -d --force-recreate api`); `jwt_secret` rotation invalidates
existing access tokens (users re-authenticate).

## Recovery

Keep an encrypted, off-host copy of these files with the owner (same discipline as
the Sokoladas backups). Without `mysql_password`/`jwt_secret` the API cannot
start; without `mysql_root_password` the database cannot be administered.
