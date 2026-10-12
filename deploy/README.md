# SapiensMetric closed-review deployment (T-023)

Exact, root-executed operations to install the SapiensMetric closed production
review on the shared Oracle host (`79.76.117.246`, `sokoladas-demo`) **alongside**
Sokoladas. Repository preparation is complete; the live install requires root —
see `docs/closed-review-deployment.md` for the access requirement and the
Sokoladas-protection sequence.

> **Ordering rule:** do not activate the closed frontend profile
> (`.github/workflows/deploy-closed.yml`) until the API is up and the owner
> access/eligibility are verified.

## 0. Prerequisites

- API image published: `.github/workflows/api-image.yml` (linux/arm64) →
  `ghcr.io/marijustechin/sapiensmetric-api@sha256:…`.
- MySQL image: `mysql:8.0.46` pinned by digest (ARM64).
- DNS: `api.sapiensmetric.eu A 79.76.117.246` (already verified).
- Root access on the host (the scoped `sokoladas-deploy` entry point is NOT
  used and must not be broadened).

## 1. Stage the project (root, additive)

```sh
# Host-only inputs (git-ignored; never committed).
sudo install -d -m 0750 -o root -g root /opt/sapiensmetric-review
sudo install -d -m 0700 -o root -g root /etc/sapiensmetric /etc/sapiensmetric/secrets

# Copy compose.yaml + images.env + hostenv from the repository/reviewer machine:
sudo cp deploy/compose.yaml /opt/sapiensmetric-review/compose.yaml
sudo cp deploy/images.env  /opt/sapiensmetric-review/images.env
sudo cp deploy/hostenv     /opt/sapiensmetric-review/hostenv
sudo chmod 0600 /opt/sapiensmetric-review/images.env /opt/sapiensmetric-review/hostenv
```

Provision secrets as in [`secrets/README.md`](secrets/README.md).

## 2. Add the proxy routing to the Sokoladas template (additive, shared)

The `api.sapiensmetric.eu` server blocks and the `sapiensmetric_api` upstream are
already in the authoritative template
`../sokoladas/sm-oracle-infra/deploy/proxy/nginx.conf`. Install them into the
running Sokoladas release by a **template refresh** (an administrator operation):

```sh
# On the host, as root, from the sm-oracle-infra checkout instance used for releases:
# 1) update /opt/sokoladas-staging/template/proxy/nginx.conf to the reviewed copy
# 2) validate the rendered config before reload
docker run --rm -v /path/to/reviewed/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v sokoladas-staging_letsencrypt:/etc/letsencrypt:ro nginx:1.30.4-alpine nginx -t
```

Do not restart the Sokoladas stack wholesale; reload only the proxy after a
successful `nginx -t`.

## 3. Issue the certificate (uses the existing certbot model)

```sh
docker compose -p sokoladas-staging exec certbot \
  certbot certonly --webroot -w /var/www/acme \
  -d api.sapiensmetric.eu --non-interactive --agree-tos -m <contact-email>
```

The certificate lands in the existing `sokoladas-staging_letsencrypt` volume and
is renewed by the existing loop. The `sokoladas.eu` certificate is untouched.

## 4. Bring up the SapiensMetric project and migrate

```sh
cd /opt/sapiensmetric-review
sudo docker compose --env-file images.env --env-file hostenv up -d db
sudo docker compose --env-file images.env --env-file hostenv \
  run --rm migrate                      # explicit migration; exit 0 required
sudo docker compose --env-file images.env --env-file hostenv up -d api
```

## 5. Provision the owner account (operator-only; no HTTP endpoint)

```sh
# Generates a strong password and prints it ONCE; it also marks the account
# verified, role=admin and reviewEligible=true.
sudo docker compose --env-file images.env --env-file hostenv \
  run --rm provision --email owner@example.org --apply
```

Additional authorised reviewers:

```sh
sudo docker compose … run --rm provision --email reviewer@example.org --apply
sudo docker compose … run --rm provision --email reviewer@example.org --grant-review --apply
```

## 6. Verify

```sh
curl -sS -o /dev/null -w '%{http_code}\n' https://api.sapiensmetric.eu/health
curl -sS -o /dev/null -w '%{http_code}\n' https://api.sapiensmetric.eu/health/ready
curl -sS -o /dev/null -w '%{http_code}\n' -X POST https://api.sapiensmetric.eu/auth/register \
  -H 'content-type: application/json' -d '{"email":"x@example.org","password":"a-very-long-password"}'
#   -> expect 403 REGISTRATION_DISABLED
```

Then verify the owner journey and, only afterwards, deploy the closed frontend
profile.

## 7. Backups and rollback

- **Database:** logical dump with the project's MySQL version, encrypted and kept
  off-host:
  ```sh
  sudo docker compose -p sapiensmetric-review exec -T db \
    sh -c 'exec mysqldump --single-transaction -u"$MYSQL_USER" -p"$(cat /run/secrets/mysql_password)" "$MYSQL_DATABASE"' \
    | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -out sapiensmetric-$(date -u +%Y%m%dT%H%M%SZ).sql.enc
  ```
  Store it outside the web root and the repository, with a secure off-host copy.
  **Long-term limitation:** a durable scheduled/off-host backup destination is not
  yet configured for SapiensMetric (only this baseline procedure); record it as
  follow-up in `sm-oracle-infra/docs/backups.md`.
- **Application rollback:** redeploy the previous `API_IMAGE` digest and recreate
  only the `api` container:
  ```sh
  # set API_IMAGE back to the previous digest in images.env, then:
  sudo docker compose --env-file images.env --env-file hostenv up -d --force-recreate api
  ```
  Image rollback is **not** database rollback; migrations are forward-only. Use
  the dump above plus a reviewed repair for schema changes.
- **Sokoladas is never touched by this project.** After every shared
  proxy/certificate/network change, re-check `sokoladas.eu` (apex `/`, `/api`,
  `/health/ready`) and the certificate.
