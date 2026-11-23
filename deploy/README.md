# Concurrent serving with Nginx and PHP-FPM

These are Linux/WSL templates, not an active deployment. The existing Windows
development server remains on port 8000. `php -S ... -t public` uses the same
built-in server as `artisan serve`; it does not add concurrency. PHP's optional
CLI worker mode is not supported on Windows and is not a production server.

## Local concurrent testing

1. On Linux or WSL, install Nginx, PHP-FPM 8.4, Composer, Node.js, and the PHP
   extensions listed in `laravel/README.md`. Enable MongoDB and other extensions
   for **both CLI and FPM**. Put this checkout at `/srv/buksu`, or change the root
   in `nginx.conf`. Use a Linux-native checkout under WSL for testing.
2. In `laravel/`, run `composer install --no-dev --optimize-autoloader`, `npm ci`,
   and `npm run build`. Remove `public/hot` if present so PHP serves built assets.
3. Supply a private `.env` with the application's existing `APP_KEY` and MongoDB
   replica-set settings. For local HTTP testing set `APP_URL=http://localhost:8080`
   and `SESSION_SECURE_COOKIE=false`. Use a separate test database for load tests.
   Do not generate a replacement key for an existing database.
4. Make `storage/` and `bootstrap/cache/` writable by `www-data`; the rest of the
   application should only need read access. Ensure FPM can read `.env`.
5. Install `php-fpm.conf` as `/etc/php/8.4/fpm/pool.d/buksu.conf` and `nginx.conf`
   as `/etc/nginx/sites-available/buksu`. Enable the site with a symlink in
   `/etc/nginx/sites-enabled/`. Adjust versioned paths for your installed PHP.
6. Validate and reload:

   ```sh
   sudo php-fpm8.4 -t
   sudo nginx -t
   sudo systemctl reload php8.4-fpm
   sudo systemctl reload nginx
   ```

Open `http://localhost:8080/login`. The pool allows up to eight simultaneous PHP
requests; this is a starting limit, not a measured capacity guarantee. Tune
`pm.max_children` using worker memory usage, available RAM, and Atlas capacity.
Compare concurrent read-only requests from separate sessions before running
mutation workflows against a synthetic database. Avoid logging response bodies
containing student information.

## Production changes

Replace the loopback listener with a properly configured HTTPS virtual host and
real hostname/certificate. If TLS terminates at Nginx, pass the HTTPS scheme to
FPM (`fastcgi_param HTTPS $https if_not_empty;`). If it terminates at a proxy,
configure Laravel's trusted proxies for that specific infrastructure.

Set `APP_ENV=production`, `APP_DEBUG=false`, the HTTPS `APP_URL`, and
`SESSION_SECURE_COOKIE=true`. Run `php artisan config:cache` and
`php artisan view:cache` after configuring the environment. Use the existing
database indexes (`php artisan guidance:setup`), backups, and application key.
File sessions work across FPM workers on one host; multiple hosts require shared
session storage. Do not expose the FPM socket or MongoDB directly to the network.

Permission grants are cached only within an HTTP request. Each new request reads
the current grants, so permission revocation needs no cross-worker cache flush.

References: [PHP built-in server](https://www.php.net/manual/en/features.commandline.webserver.php),
[PHP-FPM configuration](https://www.php.net/manual/en/install.fpm.configuration.php),
[Nginx FastCGI](https://nginx.org/en/docs/http/ngx_http_fastcgi_module.html).
