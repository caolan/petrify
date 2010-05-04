Deploying a Petrify site
========================

The most simple way to deploy a site is to run your build script locally,
then ftp, scp or rsync your files to the server. However, using version
control such as git opens up a few opportunities to improve on this (not to
mention just being a good idea for keeping a history of changes and making
backups easier!).


Using Git
---------

### Build on the server after pushing:

Using a post-update hook on the server it is possible to have the server
rebuild the site when you push your changes to it. This is my preferred
method of deployment.

First, create a checkout of your site's repository on the server, being sure
to use the account that will access the data (I'll be using www-data in this
example). I like to put my sites in /var/local/sites:

    sudo mkdir -p /var/local/sites/my_site
    cd /var/local/sites
    sudo chown www-data my_site
    sudo -u www-data git clone /path/to/repo.git my_site

Assuming you have a bare git repository at /path/to/repo.git, you can create
the hook by adding the file /path/to/repo.git/hooks/post-update and adding the
following:

    #!/bin/sh

    cd /var/local/sites/my_site || exit
    unset GIT_DIR
    sudo -u www-data git pull origin master
    sudo -u www-data node build.js

    exec git-update-server-info

Remember to make sure the script is executable. Now, when you push from your
local branch of my_site to repo.git on the server, this script will update the
repo at /var/local/sites/my_site and run the build script!
