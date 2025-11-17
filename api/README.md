# API folder

This folder contains two main parts:

- **Node.js monitor scripts**: listen to the contracts and populate a database and/or flat files.
- **PHP API**: `index.php` (with `.htaccess`) exposes that data over HTTP.

---

## 1. Node.js monitor scripts

These scripts listen to the contracts to populate a database and/or flat files.

To run them:

```bash
node monitor-attesters.js
```

You can set environment variables to configure them:

```bash
RPC_WS=wss://mainnet.infura.io/ws/v3/...
CONTRACT_ADDRESS=0x...
START_BLOCK=1234567
CONFIRMATIONS=5
node monitor-attesters.js
```

The scripts will create a `lastBlock.txt` file to keep track of the last processed block.

The main output files are:

- `attesters.txt`: list of attesters
- `lastBlock.txt`: last processed block

They will be accessible online on purpose. This information is meant to be public.

---

## 2. Serving the PHP API (`index.php` / `.htaccess`)

The `index.php` file is the entry point for the public API. The `.htaccess` file contains URL‑rewriting rules so that clean URLs (for example `/attesters`) are internally routed to `index.php`.

### 2.1. Folder layout and document root

The **web server document root** should point to this `api` folder, or this folder should be mounted as a subpath.

Examples:

- **API at root**: `https://example.com/` → document root = `/path/to/miras/api`
- **API under `/api`**: document root stays elsewhere, and this folder is served as `/api` (for example with an Apache `Alias` or Nginx `location`).

### 2.2. Apache configuration

To use `.htaccess`, Apache must have `AllowOverride` enabled for this directory and `mod_rewrite` must be enabled.

Example virtual host:

```apache
<VirtualHost *:80>
    ServerName api.example.com
    DocumentRoot /var/www/miras/api

    <Directory /var/www/miras/api>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Key points:

- `DocumentRoot` points to this `api` folder.
- `AllowOverride All` allows `.htaccess` to enable `mod_rewrite`.
- Make sure `mod_rewrite` is enabled (for example `a2enmod rewrite` on Debian/Ubuntu).

After that, you can access:

- `http://api.example.com/` → handled by `index.php`
- other API paths (for example `/attesters`) → rewritten by `.htaccess` to `index.php` and routed internally.

### 2.3. Nginx (no `.htaccess`)

Nginx does not use `.htaccess`, so you must port the rewrite rules from `.htaccess` into your Nginx config. A typical configuration looks like this:

```nginx
server {
    server_name api.example.com;
    root /var/www/miras/api;
    index index.php;

    location / {
        try_files $uri /index.php?$args;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_pass unix:/run/php/php-fpm.sock; # adjust to your PHP-FPM socket or host:port
    }
}
```

Adjust `root` and `fastcgi_pass` to match your deployment.

### 2.4. Local development

For a quick local test without Apache or Nginx, you can use PHP’s built‑in server from this folder:

```bash
php -S localhost:8000 index.php
```

Then open:

- `http://localhost:8000/` to hit `index.php` directly

Routes that rely on `.htaccess` rewrites will not work automatically with the built‑in server. If needed, you can access them explicitly via query parameters (for example `http://localhost:8000/index.php?route=attesters`) or add simple routing logic inside `index.php` for development.

---

In production:

- The **Node.js scripts** keep `attesters.txt` and `lastBlock.txt` up to date.
- The **PHP API** reads those files (and/or the database) and serves them publicly via `index.php`, with `.htaccess` (on Apache) or equivalent rules (on Nginx) providing clean URLs.
