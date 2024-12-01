import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
// import { neynar } from 'frog/hubs'
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import axios from "axios";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(`${supabaseUrl}`, `${supabaseKey}`);

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
  title: "Frog Frame",
});

//first frame
app.frame("/", (c) => {
  return c.res({
    action: "/getWrapped",
    image: (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(to right, #432889, #17101F)",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 60,
            fontStyle: "normal",
            letterSpacing: "-0.025em",
            lineHeight: 1.4,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
          }}
        >
          {`Let's wrap it up?`}
        </div>
      </div>
    ),
    intents: [<Button action="/getWrapped">Get Wrapped</Button>],
  });
});

//first non-cached route
app.frame("/getWrapped", async (c) => {
  //get name from fid for personalized response
  const headers = {
    Accept: "application/json",
    "API-KEY": `${process.env.WIELD_API_KEY}`,
  };

  const res = await axios.get(
    `https://build.wield.xyz/farcaster/v2/user?fid=${c.frameData?.fid}`,
    { headers }
  );
  const uName = await res.data.result.user.displayName;

  //check if the button is clicked for wrap data
  const { buttonValue, status } = c;

  let responseText: string = `Hi, ${uName} let's get  your wrap`;

  if (status == "response" && buttonValue == "get_wrap") {
    responseText = "Hey";
  }
  //if the button is clicked the frame is rerendered with buttonValue
  if (status == "response" && buttonValue == "get_wrap") {
    (async () => {
      const { data, error } = await supabase
        .from("wrapData")
        .select("*")
        .eq("fid", `${c.frameData?.fid}`);

      if (!error) {
        if (data.length > 0) {
          //data found
          //display the response
          console.log("found");
        } else {
          //data not found
          //get from wield pass it down to ML model

          //get casts
          const casts = await axios.get(
            `https://build.wield.xyz/farcaster/v2/casts?fid=${c.frameData?.fid}`,
            { headers }
          );

          /*description, following, followers, wallets*/
          console.log(
            "on the job",
            await casts.data.result.casts[1].text,
            res.data.result.user.followingCount,
            res.data.result.user.followerCount,
            res.data.result.user.allConnectedAddresses
          );
        }
      }
    })();
  }

  return c.res({
    image: (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(to right, #432889, #17101F)",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 60,
            fontStyle: "normal",
            letterSpacing: "-0.025em",
            lineHeight: 1.4,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
          }}
        >
          {responseText}
        </div>
      </div>
    ),
    intents: [<Button value="get_wrap">Give my wrap</Button>],
  });
});

app.hono.get("/test", (c) => {
  return c.json("ribbit");
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
