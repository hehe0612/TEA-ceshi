#!/usr/bin/env -S tea -E

/*---
args:
  - deno
  - run
  - --allow-net
  - --allow-read
  - --allow-env
  - --import-map={{ srcroot }}/import-map.json
---*/

import { S3 } from "s3"
import { panic } from "utils"
import Path from "path"

const usage = "usage: cache-artifacts.ts {REPO} {REF} {archive}"
const repo = Deno.args[0] ?? panic(usage);
const ref = Deno.args[1] ?? panic(usage);
const artifacts = Deno.args[2] ?? panic(usage);

if (!repo.startsWith("teaxyz/")) throw new Error(`offical teaxyz repos only: ${repo}`)
const pr = parseInt(ref.replace(/refs\/pull\/(\d+)\/merge/, "$1"))
if (isNaN(pr)) throw new Error(`invalid ref: ${ref}`)

const file = Path.cwd().join(artifacts).isFile() ?? panic(`invalid archive: ${artifacts}`)

const s3 = new S3({
  accessKeyID: Deno.env.get("AWS_ACCESS_KEY_ID")!,
  secretKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
  region: "us-east-1",
})
const bucket = s3.getBucket(Deno.env.get("AWS_S3_BUCKET")!)

const key = `pull-request/${repo.split("/")[1]}/${pr}/${file.basename()}`
const body = await Deno.readFile(file.string)

console.log({ uploadingTo: key })
await bucket.putObject(key, body)
