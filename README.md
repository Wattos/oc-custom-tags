# Description

oc-custom-tag is a very simple Owncloud app which extends the file list with tag support. Owncloud already has support for tags on all files, but does not expose any UI for it. This simple app makes a UI available for the user to add and remove custom tags.

# Tags
Place this app in **owncloud/apps/**

## Publish to App Store

First get an account for the [App Store](http://apps.owncloud.com/) then run:

    make appstore

**ocdev** will ask for your App Store credentials and save them to ~/.ocdevrc which is created afterwards for reuse.

If the <ocsid> field in **appinfo/info.xml** is not present, a new app will be created on the appstore instead of updated. You can look up the ocsid in the app page URL, e.g.: **http://apps.owncloud.com/content/show.php/News?content=168040** would use the ocsid **168040**

## Running tests
After [Installing PHPUnit](http://phpunit.de/getting-started.html) run:

    phpunit -c phpunit.xml