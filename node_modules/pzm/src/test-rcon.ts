imporet { Rcon } from "rcon-client";

async function main() {
  const rcon = await Rcon.connect({
    host: "papermc",
    port: 25575,
    password: 990876,
  });

  const res = await rcon.send("list");
  console.log("RCON 回應:", res);

  await rcon.end();
}

main().catch(console.error);