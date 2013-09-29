ADS-B Monitor
=============

A web-based frontend for the `dump1090` tool used to monitor ADS-B signals. Update the `href` variable in `index.html` to reflect the URL you wish to pull the `data.json`. This can either point directly to the `dump1090` server's `data.json` file, or it can point to `data.php`, a local script that can act as a proxy. If using `data.php`, open that file and update its `$href` variable.

A slightly modified version of `gmap.html` is included, as well. It points to `data.php` by default.

Use [my slighly modified version of `dump1090`](https://github.com/courtarro/dump1090) to see all flights (including those with no positional data) as well as gain access to the "Message count" and "Last seen" values.
