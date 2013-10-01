ADS-B Monitor
=============

A web-based frontend for the `dump1090` tool used to monitor ADS-B signals. Update the `DATA_HREF` variable in `js/common.js` to reflect the URL you wish to pull the `data.json` feed from. This can either point directly to the `dump1090` server's `data.json` file, a local proxy redirect, or it can use `examples/data.php` as a local script that can retrieve and forward the feed. If using `data.php`, open that file and update its `$href` variable. An example of an `nginx` configuration that includes a URL-based `data.json` proxy redirect is included in `examples/adsb.nginx`.

An enhanced version of the built-in `gmap.html` is included as the index. A custom table that shows the details of all flights exists at `details.html`.

Use [my slighly modified version of `dump1090`](https://github.com/courtarro/dump1090) to see all flights (including those with no positional data) as well as gain access to the "Message count" and "Last seen" values.

PHP is not required unless using the `data.php` proxy.
