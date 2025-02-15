# CraftStats

[![Node.js CI](https://github.com/MrMicky-FR/CraftStats/actions/workflows/tests.yml/badge.svg)](https://github.com/MrMicky-FR/CraftStats/actions/workflows/tests.yml)

Minecraft servers tracker built on [Cloudflare Workers](https://workers.cloudflare.com/) with [Vue.js](https://vuejs.org/).

![Screenshot](screenshot.png)

## Features

* Fast, running on more than 300 datacenters worldwide thanks to [Cloudflare Workers](https://workers.cloudflare.com/)
* Historical player counts for the last few months
* Fully responsive
* Intuitive interface to manage servers
* Supports both Minecraft: Java Edition and Minecraft: Bedrock Edition support
* Fully translatable

## Installation

* Install [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update)
* Run `npm install` to install dependencies
* Copy `wrangler.example.toml` to `wrangler.toml`
* Create a KV namespace named `KV_SERVERS` and add its id in the `wrangler.toml`
* Build the Vue.js frontend with `cd frontend && npm install && npm run build`
* Deploy to Cloudflare Workers with `wrangler deploy`

### Edit servers list

* Add an edit token to the `wrangler.toml` file, by editing the value of `SERVERS_EDIT_TOKEN` 
* Go on `/editor` and change the servers
* Enter the token and save

## Credits

CraftStats was inspired by [MineStats](https://github.com/nathan818fr/minestats) (by [nathan818](https://github.com/nathan818fr)),
which unfortunately is no longer maintained today.
