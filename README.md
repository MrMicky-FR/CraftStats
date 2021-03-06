# CraftStats

[![Node.js CI](https://github.com/MrMicky-FR/CraftStats/actions/workflows/tests.yml/badge.svg)](https://github.com/MrMicky-FR/CraftStats/actions/workflows/tests.yml)
[![Language grade](https://img.shields.io/lgtm/grade/javascript/github/MrMicky-FR/CraftStats.svg?logo=lgtm&logoWidth=18&label=code%20quality)](https://lgtm.com/projects/g/MrMicky-FR/CraftStats/context:javascript)

Minecraft servers tracker built on [Cloudflare Workers](https://workers.cloudflare.com/) with [Vue.js](https://vuejs.org/).

You can see it live on [craftstats.net](https://craftstats.net)

![Screenshot](screenshot.png)

## Features

* Fast, it's running on more than 200 datacenters worldwide thanks to the power of [Cloudflare Workers](https://workers.cloudflare.com/)
* Historical players count of the last months
* Fully responsive
* UI to edit servers
* Minecraft: Bedrock Edition support

## Installation

* Install [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update)
* Install dependencies with `npm install`
* Copy `wrangler.example.toml` to `wrangler.toml`
* Create a KV namespace named `KV_SERVERS` and add its id in the `wrangler.toml`
* Build the Vue.js frontend with `cd frontend && npm install && npm run build`
* Publish to Workers with `workers publish`

### Edit servers list

* Add an edit token in the `wrangler.toml` by editing the value of `SERVERS_EDIT_TOKEN` 
* Go on `/editor` and change servers
* Enter the token and save

# Support for Minecraft: Bedrock Edition

As currently Workers doesn't support opening sockets connections,
CraftStats uses by default [MC-API.net](https://mc-api.net/) to ping servers, but it
doesn't support Bedrock servers.

If you want to add Bedrock servers, you can deploy the [ping function](ping-function) to
a serverless provider with [Node.js](https://nodejs.org/) support, like
[Scaleway Functions](https://www.scaleway.com/en/serverless-functions/) and set
the `PING_FUNCTION_URL` in the `wrangler.toml`. This function is only used
to ping servers and everything else is still done on Cloudflare Workers.

## Credits

CraftStats is inspired by [MineStats](https://github.com/nathan818fr/minestats) (by [nathan818](https://github.com/nathan818fr)),
which is unfortunately no longer maintained today.
